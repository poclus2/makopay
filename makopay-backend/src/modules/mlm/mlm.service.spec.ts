import { Test, TestingModule } from '@nestjs/testing';
import { MlmService } from './mlm.service';

describe('MlmService', () => {
  let service: MlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MlmService],
    }).compile();

    service = module.get<MlmService>(MlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
