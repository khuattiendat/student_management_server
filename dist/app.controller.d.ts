import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getAdminDashboard(branchId?: string): Promise<{
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
}
