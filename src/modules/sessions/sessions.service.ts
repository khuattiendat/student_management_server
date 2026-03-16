import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { Session } from '@/database/entities/session.entity';
import { Class } from '@/database/entities/class.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';

type SessionImportPayload = {
  classId: number;
  sessionDate: Date;
  startTime: string;
  endTime: string;
};

type SessionImportError = {
  row: number;
  field: string;
  message: string;
};

const IMPORT_MAX_ROWS = 5000;
const MAX_ERROR_PREVIEW = 50;
const HEADER_ALIASES = {
  classId: ['classId', 'class_id'],
  sessionDate: ['sessionDate', 'session_date', 'date'],
  startTime: ['startTime', 'start_time'],
  endTime: ['endTime', 'end_time'],
} as const;

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

  async create(createSessionDto: CreateSessionDto) {
    await this.ensureClassExists(createSessionDto.classId);
    this.validateTimeRange(
      createSessionDto.startTime,
      createSessionDto.endTime,
    );

    const session = this.sessionRepository.create({
      ...createSessionDto,
      sessionDate: new Date(createSessionDto.sessionDate),
    });

    return this.sessionRepository.save(session);
  }

  async findAll(query: QuerySessionDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.max(Number(query.limit) || 10, 1);
    const search = query.search?.trim();

    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.classEntity', 'classEntity')
      .orderBy('session.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        new Brackets((builder) => {
          builder
            .where('classEntity.name LIKE :search', { search: `%${search}%` })
            .orWhere('session.startTime LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('session.endTime LIKE :search', { search: `%${search}%` })
            .orWhere('session.sessionDate LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    if (query.classId) {
      const classId = Number(query.classId);
      if (!Number.isInteger(classId) || classId < 1) {
        throw new BadRequestException('classId must be a positive integer');
      }
      queryBuilder.andWhere('session.classId = :classId', { classId });
    }

    if (query.sessionDate) {
      queryBuilder.andWhere('session.sessionDate = :sessionDate', {
        sessionDate: query.sessionDate,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['classEntity'],
    });

    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }

    return session;
  }

  async update(id: number, updateSessionDto: UpdateSessionDto) {
    const session = await this.findOne(id);

    if (updateSessionDto.classId !== undefined) {
      await this.ensureClassExists(updateSessionDto.classId);
    }

    const nextStartTime = updateSessionDto.startTime ?? session.startTime;
    const nextEndTime = updateSessionDto.endTime ?? session.endTime;
    this.validateTimeRange(nextStartTime, nextEndTime);

    Object.assign(session, {
      ...updateSessionDto,
      sessionDate: updateSessionDto.sessionDate
        ? new Date(updateSessionDto.sessionDate)
        : session.sessionDate,
    });

    return this.sessionRepository.save(session);
  }

  async remove(id: number) {
    const session = await this.findOne(id);
    await this.sessionRepository.remove(session);

    return {
      message: 'Session deleted successfully',
      id,
    };
  }

  async importExcel(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const sheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    if (!rows.length) {
      throw new BadRequestException('Excel file is empty');
    }

    if (rows.length > IMPORT_MAX_ROWS) {
      throw new BadRequestException(
        `Excel file cannot exceed ${IMPORT_MAX_ROWS} rows`,
      );
    }

    const missingColumns = this.getMissingColumns(rows[0]);
    if (missingColumns.length) {
      throw new BadRequestException({
        message: 'Invalid Excel columns',
        requiredColumns: Object.keys(HEADER_ALIASES),
        missingColumns,
      });
    }

    const errors: SessionImportError[] = [];
    const payloads: SessionImportPayload[] = [];
    const duplicateKeys = new Set<string>();

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      try {
        const classIdRaw = this.getRowValue(row, HEADER_ALIASES.classId);
        const sessionDateRaw = this.getRowValue(
          row,
          HEADER_ALIASES.sessionDate,
        );
        const startTimeRaw = this.getRowValue(row, HEADER_ALIASES.startTime);
        const endTimeRaw = this.getRowValue(row, HEADER_ALIASES.endTime);
        const classId = this.parsePositiveInt(classIdRaw, 'classId');
        const sessionDate = this.parseDate(sessionDateRaw, 'sessionDate');
        const startTime = this.parseTime(startTimeRaw, 'startTime');
        const endTime = this.parseTime(endTimeRaw, 'endTime');

        this.validateTimeRange(startTime, endTime);

        const duplicateKey = `${classId}|${this.toIsoDateOnly(sessionDate)}|${startTime}|${endTime}`;
        if (duplicateKeys.has(duplicateKey)) {
          throw new Error('duplicate session in file');
        }
        duplicateKeys.add(duplicateKey);

        payloads.push({
          classId,
          sessionDate,
          startTime,
          endTime,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Invalid row format';
        errors.push({
          row: rowNumber,
          field: this.inferErrorField(message),
          message,
        });
      }
    });

    if (errors.length) {
      throw new BadRequestException({
        message: 'Invalid Excel data',
        totalErrors: errors.length,
        errors: errors.slice(0, MAX_ERROR_PREVIEW),
        hasMoreErrors: errors.length > MAX_ERROR_PREVIEW,
      });
    }

    const classIds = [...new Set(payloads.map((item) => item.classId))];
    const existingClasses = await this.classRepository.find({
      where: { id: In(classIds) },
    });
    const existingClassIdSet = new Set(existingClasses.map((item) => item.id));
    const invalidClassIds = classIds.filter(
      (id) => !existingClassIdSet.has(id),
    );

    if (invalidClassIds.length) {
      throw new BadRequestException(
        `Invalid classId(s): ${invalidClassIds.join(', ')}`,
      );
    }

    const entities = this.sessionRepository.create(payloads);
    await this.sessionRepository.manager.transaction(async (manager) => {
      await manager.save(Session, entities);
    });

    return {
      message: 'Sessions imported successfully',
      totalRows: rows.length,
      totalImported: entities.length,
    };
  }

  private async ensureClassExists(classId: number) {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      throw new BadRequestException(`Invalid classId: ${classId}`);
    }
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('endTime must be greater than startTime');
    }
  }

  private getRowValue(
    row: Record<string, unknown>,
    aliases: readonly string[],
  ) {
    const normalizedAliases = aliases.map((alias) => this.normalizeKey(alias));

    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = this.normalizeKey(key);
      if (normalizedAliases.includes(normalizedKey)) {
        return value;
      }
    }

    return undefined;
  }

  private normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private parsePositiveInt(value: unknown, fieldName: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new Error(`${fieldName} must be a positive integer`);
    }
    return parsed;
  }

  private parseDate(value: unknown, fieldName: string): Date {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return this.normalizeDate(value);
    }

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) {
        throw new Error(`${fieldName} is invalid`);
      }
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error(`${fieldName} is required`);
      }

      const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateOnlyMatch) {
        const year = Number(dateOnlyMatch[1]);
        const month = Number(dateOnlyMatch[2]);
        const day = Number(dateOnlyMatch[3]);
        const parsedDate = new Date(year, month - 1, day);
        if (!Number.isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return this.normalizeDate(parsed);
      }
    }

    throw new Error(`${fieldName} is invalid`);
  }

  private parseTime(value: unknown, fieldName: string): string {
    if (typeof value === 'number') {
      const totalSeconds = Math.round(value * 24 * 60 * 60);
      const normalizedSeconds = ((totalSeconds % 86400) + 86400) % 86400;
      const hours = Math.floor(normalizedSeconds / 3600)
        .toString()
        .padStart(2, '0');
      const minutes = Math.floor((normalizedSeconds % 3600) / 60)
        .toString()
        .padStart(2, '0');

      return `${hours}:${minutes}`;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        throw new Error(`${fieldName} is required`);
      }

      const militaryTimeRegex = /^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
      if (militaryTimeRegex.test(trimmed)) {
        const [hourPart, minutePart] = trimmed.split(':');
        const hours = hourPart.padStart(2, '0');
        return `${hours}:${minutePart}`;
      }
    }

    throw new Error(`${fieldName} must be in HH:mm format`);
  }

  private normalizeDate(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private toIsoDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private getMissingColumns(row: Record<string, unknown>): string[] {
    return Object.entries(HEADER_ALIASES)
      .filter(([, aliases]) => this.getRowValue(row, aliases) === undefined)
      .map(([field]) => field);
  }

  private inferErrorField(message: string): string {
    if (message.includes('classId')) {
      return 'classId';
    }
    if (message.includes('sessionDate')) {
      return 'sessionDate';
    }
    if (message.includes('startTime')) {
      return 'startTime';
    }
    if (message.includes('endTime')) {
      return 'endTime';
    }
    if (message.includes('duplicate')) {
      return 'row';
    }
    return 'unknown';
  }
}
