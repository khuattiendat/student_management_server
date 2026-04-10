import { BaseEntity } from '@/common/base/base.entity';
import { Enrollment } from './enrollment.entity';
import { ClassPackage } from './class_packages.entity';
export declare enum PackageType {
    CERTIFICATE = "certificate",
    GENERAL = "general",
    SCHOOL_SUBJECT = "school_subject"
}
export declare enum Curriculum {
    ENGLISH = "english",
    CHINESE = "chinese"
}
export declare enum ComboType {
    STANDARD = "standard",
    BREAKTHROUGH = "breakthrough",
    ACCOMPANYING = "accompanying"
}
export declare enum CertificateType {
    IELTS = "ielts",
    TOEIC = "toeic",
    HSK = "hsk",
    YCT = "yct"
}
export declare enum Subject {
    VAN = "van",
    TOAN = "toan",
    TIENG_VIET = "tieng_viet",
    THE_DUC = "the_duc",
    HOA = "hoa",
    VAT_LY = "vat_ly",
    MA_THUAT_HAC_AM = "ma_thuat_hac_am",
    GDCD = "gdcd",
    DAO_DUC = "dao_duc",
    THE_THUAT = "the_thuat",
    TU_NHIEN_XA_HOI = "tu_nhien_xa_hoi",
    LICH_SU = "lich_su",
    NHAN_THUAT = "nhan_thuat",
    DIA_LY = "dia_ly"
}
export declare enum ClassTYpe {
    LOP_1 = "lop_1",
    LOP_2 = "lop_2",
    LOP_3 = "lop_3",
    LOP_4 = "lop_4",
    LOP_5 = "lop_5",
    LOP_6 = "lop_6",
    LOP_7 = "lop_7",
    LOP_8 = "lop_8",
    LOP_9 = "lop_9",
    LOP_10 = "lop_10",
    LOP_11 = "lop_11",
    LOP_12 = "lop_12"
}
export interface PackageInfo {
    type?: PackageType;
    curriculum?: Curriculum;
    comboType?: ComboType;
    certificateType?: CertificateType;
    subject?: Subject;
    class?: ClassTYpe;
}
export declare class Package extends BaseEntity {
    name: string;
    totalSessions: number;
    price: string;
    type: PackageType;
    info: PackageInfo;
    enrollments: Enrollment[];
    classPackage: ClassPackage[];
}
