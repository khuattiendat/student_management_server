import { DataSource } from 'typeorm';
export declare class AppService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getHello(): string;
    getAdminDashboard(params: {
        branchId?: string;
    }): Promise<{
        branchFilter: {
            branchId: number | null;
            branchName: string | null;
        };
        overview: {
            studentsTotal: number;
            teachersTotal: number;
            classesTotal: number;
            newStudentsLast6Months: number;
        };
        topClassesBySize: {
            classId: number;
            className: string;
            branchId: number;
            branchName: string;
            size: number;
        }[];
        newStudentsByMonth: {
            month: string;
            monthLabel: string;
            count: number;
        }[];
        byBranch: {
            branchId: number;
            branchName: string;
            studentsTotal: number;
            teachersTotal: number;
            classesTotal: number;
            newStudentsLast6Months: number;
        }[];
    }>;
    private parseOptionalPositiveInt;
    private getSelectedBranchOrThrow;
    private getStudentsTotal;
    private getClassesTotal;
    private getTeachersTotal;
    private getNewStudentsLast6Months;
    private getNewStudentsByMonth;
    private getTopClassesBySize;
    private getStatsByBranch;
}
