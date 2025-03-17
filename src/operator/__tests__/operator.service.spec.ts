import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { OperatorService } from '../operator.service';
import { Operator, OperatorDocument } from '../schema/operator.schema';
import mongoose from 'mongoose';

describe('OperatorService', () => {
  let service: OperatorService;
  let operatorModel: any;

  beforeEach(async () => {
    operatorModel = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorService,
        {
          provide: getModelToken(Operator.name),
          useValue: operatorModel,
        },
      ],
    }).compile();

    service = module.get<OperatorService>(OperatorService);
  });

  describe('getOperator', () => {
    it('should return null if operatorId is invalid', async () => {
      const result = await service.getOperator('invalid_id');
      expect(result).toBeNull();
    });

    it('should return operator if found', async () => {
      const operatorId = new mongoose.Types.ObjectId().toString();
      const objectId = new mongoose.Types.ObjectId(operatorId);
      const operatorData: Partial<OperatorDocument> = {
        _id: objectId,
      };
      operatorModel.findById.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(operatorData) }),
      });

      const result = await service.getOperator(operatorId);
      expect(result).toEqual(operatorData);
    });

    it('should return null if operator is not found', async () => {
      const operatorId = new mongoose.Types.ObjectId().toString();
      operatorModel.findById.mockReturnValue({
        lean: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });

      const result = await service.getOperator(operatorId);
      expect(result).toBeNull();
    });
  });
});
