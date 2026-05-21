import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStockItemsTable1779316735759 implements MigrationInterface {
    name = 'CreateStockItemsTable1779316735759'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stock_items" ("productId" integer NOT NULL, "quantity" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bbfb82762aee45829f290ef3381" PRIMARY KEY ("productId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "stock_items"`);
    }

}
