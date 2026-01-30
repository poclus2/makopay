import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        return this.prisma.product.create({
            data: {
                ...createProductDto,
                price: new Prisma.Decimal(createProductDto.price),
            },
        });
    }

    async findAll(minPrice?: number, maxPrice?: number, planId?: string): Promise<Product[]> {
        const where: Prisma.ProductWhereInput = { deletedAt: null };

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = new Prisma.Decimal(minPrice);
            if (maxPrice !== undefined) where.price.lte = new Prisma.Decimal(maxPrice);
        }

        if (planId) {
            where.investmentPlanId = planId;
        }

        return this.prisma.product.findMany({
            where,
            include: { investmentPlan: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string): Promise<Product | null> {
        return this.prisma.product.findFirst({
            where: { id, deletedAt: null },
            include: { investmentPlan: true },
        });
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        const data: any = { ...updateProductDto };
        if (updateProductDto.price !== undefined) {
            data.price = new Prisma.Decimal(updateProductDto.price);
        }
        return this.prisma.product.update({
            where: { id },
            data,
        });
    }

    async remove(id: string): Promise<Product> {
        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
}
