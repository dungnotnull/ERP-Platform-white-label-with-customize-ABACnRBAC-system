import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ReconcileInternalUserDeviceSummariesUseCase } from '@/domains/organization/application/use-cases/internal-user/reconcile-internal-user-device-summaries.use-case';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const useCase = app.get(ReconcileInternalUserDeviceSummariesUseCase);
    const result = await useCase.execute();
    console.log(
      `Reconciled device summaries: ${result.usersUpdated} users, ${result.usersWithDevices} with active devices`,
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
