import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersTable1779354445981 implements MigrationInterface {
    name = 'CreateOrdersTable1779354445981'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."orders_status_enum" AS ENUM('PENDING', 'CONFIRMED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" SERIAL NOT NULL, "productId" integer NOT NULL, "quantity" integer NOT NULL, "customerEmail" character varying NOT NULL, "status" "public"."orders_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    }

}
