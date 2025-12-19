import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Nodes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates root and a folder, then lists children', async () => {
    const owner = '1';
    const rootRes = await request(app.getHttpServer())
      .get('/nodes/root')
      .set('x-owner-id', owner)
      .expect(200);

    const rootId = rootRes.body.id;

    const folderRes = await request(app.getHttpServer())
      .post('/nodes/folders')
      .set('x-owner-id', owner)
      .send({ parentId: rootId, name: 'projects' })
      .expect(201);

    const listRes = await request(app.getHttpServer())
      .get(`/nodes/${rootId}/children?limit=50`)
      .set('x-owner-id', owner)
      .expect(200);

    expect(listRes.body.items.map((x: any) => x.name)).toContain('projects');
    expect(folderRes.body.name).toBe('projects');
  });
});
