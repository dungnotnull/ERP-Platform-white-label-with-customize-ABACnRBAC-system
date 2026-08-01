import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '@/app.module';
import { Logger } from '@nestjs/common';
import _ from 'lodash';

const logger = new Logger('NormalizeEndpointPaths');

function pathPatternToRegex(pattern: string): string {
  const escaped = pattern
    .replace(/\//g, '\\/')
    .replace(/:[^/]+/g, '[^/]+');
  return `^${escaped}$`;
}

function normalizePath(path: string): string {
  let normalized = path.trim();

  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  normalized = normalized
    .replace(/^\/api\/v1\//, '/')
    .replace(/^\/api\//, '/')
    .replace(/^\/v1\//, '/')
    .replace(/\/v1\/v1\//g, '/v1/')
    .replace(/\/api\/v1\//g, '/')
    .replace(/\/api\/api\//g, '/api/');

  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  return normalized;
}

interface EndpointPermissionDoc {
  _id: any;
  pathPattern: string;
  pathRegex: string;
  method: string;
  module: string;
  permission: string;
}

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const epModel = app.get(getModelToken('EndpointPermission'));

    const allEps: EndpointPermissionDoc[] = await epModel.find({}).lean();
    logger.log(`Found ${allEps.length} endpoint permissions in database`);

    let updatedCount = 0;
    let skippedCount = 0;
    const updates: Array<{ id: string; oldPath: string; newPath: string }> = [];

    for (const ep of allEps) {
      const normalized = normalizePath(ep.pathPattern);

      if (normalized === ep.pathPattern) {
        skippedCount++;
        continue;
      }

      const newRegex = pathPatternToRegex(normalized);

      await epModel.updateOne(
        { _id: ep._id },
        { $set: { pathPattern: normalized, pathRegex: newRegex } },
      );

      updates.push({
        id: ep._id.toString(),
        oldPath: ep.pathPattern,
        newPath: normalized,
      });
      updatedCount++;
    }

    logger.log(`Skipped: ${skippedCount} (already normalized)`);
    logger.log(`Updated: ${updatedCount}`);

    if (updates.length > 0) {
      logger.log('Changes made:');
      for (const u of updates) {
        logger.log(`  ${u.oldPath} → ${u.newPath}`);
      }

      // Reload all active EPs to verify
      const activeCount = await epModel.countDocuments({ isActive: true });
      logger.log(`Active endpoint permissions after normalization: ${activeCount}`);
    } else {
      logger.log('All endpoint permission paths are already normalized. Nothing to do.');
    }
  } finally {
    await app.close();
  }
}

run()
  .then(() => {
    logger.log('Normalization complete');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Normalization failed', error);
    process.exit(1);
  });
