import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/base/base.entity';
import { Enrollment } from './enrollment.entity';
import { Class } from './class.entity';
import { ClassPackage } from './class_packages.entity';

export enum PackageType {
  CERTIFICATE = 'certificate', // Lớp học có chứng chỉ (tính theo số lượng buổi học)
  GENERAL = 'general', // Lớp học phổ  thông (tính theo thời gian)
  SCHOOL_SUBJECT = 'school_subject', // Lớp học theo môn học (tính theo thời gian)
}
// Chương trình học
export enum Curriculum {
  ENGLISH = 'english',
  CHINESE = 'chinese',
}
// Loại combo
export enum ComboType {
  STANDARD = 'standard', // Combo tiêu chuẩn
  BREAKTHROUGH = 'breakthrough', // Combo đột phá
  ACCOMPANYING = 'accompanying', // Combo đồng hành
}
// loại chứng chỉ
export enum CertificateType {
  IELTS = 'ielts',
  TOEIC = 'toeic',
  HSK = 'hsk',
  YCT = 'yct',
}
export enum Subject {
  VAN = 'van',
  TOAN = 'toan',
  TIENG_VIET = 'tieng_viet',
  THE_DUC = 'the_duc',
  HOA = 'hoa',
  VAT_LY = 'vat_ly',
  MA_THUAT_HAC_AM = 'ma_thuat_hac_am',
  GDCD = 'gdcd',
  DAO_DUC = 'dao_duc',
  THE_THUAT = 'the_thuat',
  TU_NHIEN_XA_HOI = 'tu_nhien_xa_hoi',
  LICH_SU = 'lich_su',
  NHAN_THUAT = 'nhan_thuat',
  DIA_LY = 'dia_ly',
}
export enum ClassTYpe {
  LOP_1 = 'lop_1',
  LOP_2 = 'lop_2',
  LOP_3 = 'lop_3',
  LOP_4 = 'lop_4',
  LOP_5 = 'lop_5',
  LOP_6 = 'lop_6',
  LOP_7 = 'lop_7',
  LOP_8 = 'lop_8',
  LOP_9 = 'lop_9',
  LOP_10 = 'lop_10',
  LOP_11 = 'lop_11',
  LOP_12 = 'lop_12',
}
export interface PackageInfo {
  type?: PackageType;
  curriculum?: Curriculum;
  comboType?: ComboType;
  certificateType?: CertificateType;
  subject?: Subject;
  class?: ClassTYpe;
}

@Entity('packages')
export class Package extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'total_sessions', type: 'int', nullable: true })
  totalSessions: number;

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: false,
  })
  price: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: PackageType,
    nullable: false,
    default: PackageType.CERTIFICATE,
  })
  type: PackageType;

  @Column({
    name: 'info',
    type: 'json',
    nullable: true,
  })
  info: PackageInfo;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.package)
  enrollments: Enrollment[];

  @OneToMany(() => ClassPackage, (classPackage) => classPackage.package)
  classPackage: ClassPackage[];
}
