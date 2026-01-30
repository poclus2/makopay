import { Test, TestingModule } from '@nestjs/testing';
import { MlmController } from './mlm.controller';

describe('MlmController', () => {
  let controller: MlmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MlmController],
    }).compile();

    controller = module.get<MlmController>(MlmController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
