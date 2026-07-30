import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { BranchesModule } from './modules/branches/branches.module';
import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { FinancialYearsModule } from './modules/financial-years/financial-years.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { GradesModule } from './modules/grades/grades.module';
import { SectionsModule } from './modules/sections/sections.module';
import { FeeHeadsModule } from './modules/fee-heads/fee-heads.module';
import { FeeStructuresModule } from './modules/fee-structures/fee-structures.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ImportsModule } from './modules/imports/imports.module';
import { StudentsModule } from './modules/students/students.module';
import { GuardiansModule } from './modules/guardians/guardians.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';
import { appConfig, validationSchema } from './config/app.config';

@Module({
  imports: [
    // ─── Config ──────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // ─── Rate Limiting ────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 300,
      },
    ]),

    // ─── Events ───────────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
    }),

    // ─── Scheduling ───────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Database ─────────────────────────────────────────
    PrismaModule,

    // ─── Domain Modules ───────────────────────────────────
    AuthModule,
    UsersModule,
    RolesModule,
    OrganisationsModule,
    BranchesModule,
    AcademicYearsModule,
    FinancialYearsModule,
    DepartmentsModule,
    GradesModule,
    SectionsModule,
    FeeHeadsModule,
    FeeStructuresModule,
    PaymentsModule,
    ReportsModule,
    PromotionsModule,
    NotificationsModule,
    ImportsModule,
    StudentsModule,
    GuardiansModule,
    AuditLogsModule,
    HealthModule,
    SettingsModule,
  ],
})
export class AppModule {}
