import { StudentParentDto } from './student-parent.dto';
export declare class CreateStudentDto {
    name: string;
    addressDetail?: string;
    provinceCode?: number;
    wardCode?: number;
    provinceName?: string;
    wardName?: string;
    birthday?: Date | null;
    phone?: string;
    branchId?: number;
    parents?: StudentParentDto[];
    packageIds?: number[];
    isPaid?: boolean;
}
