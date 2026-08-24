-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "InvestmentPositionType" AS ENUM ('FIXED_INCOME', 'STOCK', 'REAL_ESTATE_FUND', 'CRYPTO', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestmentMovementType" AS ENUM ('CONTRIBUTION', 'WITHDRAWAL', 'YIELD');

-- CreateEnum
CREATE TYPE "EmergencyFundMovementType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "color" CHAR(7) NOT NULL,
    "icon" TEXT,
    "type" "CategoryType" NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_incomes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "receipt_day" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variable_incomes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "estimated_amount" DECIMAL(12,2) NOT NULL,
    "actual_amount" DECIMAL(12,2),
    "description" TEXT,
    "month" CHAR(7) NOT NULL,
    "is_received" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variable_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variable_income_tags" (
    "id" SERIAL NOT NULL,
    "variable_income_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "variable_income_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_expenses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "due_day" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variable_expenses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "estimated_amount" DECIMAL(12,2) NOT NULL,
    "actual_amount" DECIMAL(12,2),
    "description" TEXT,
    "month" CHAR(7) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variable_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variable_expense_tags" (
    "id" SERIAL NOT NULL,
    "variable_expense_id" INTEGER NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "variable_expense_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_budgets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "month" CHAR(7) NOT NULL,
    "total_planned" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_lines" (
    "id" SERIAL NOT NULL,
    "budget_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "planned_amount" DECIMAL(12,2) NOT NULL,
    "spent_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "budget_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_funds" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_funds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_fund_movements" (
    "id" SERIAL NOT NULL,
    "fund_id" INTEGER NOT NULL,
    "type" "EmergencyFundMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,

    CONSTRAINT "emergency_fund_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_positions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InvestmentPositionType" NOT NULL,
    "current_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_movements" (
    "id" SERIAL NOT NULL,
    "position_id" INTEGER NOT NULL,
    "type" "InvestmentMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,

    CONSTRAINT "investment_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_category_type" ON "categories"("type");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_type_key" ON "categories"("user_id", "name", "type");

-- CreateIndex
CREATE INDEX "idx_fixed_income_user_active" ON "fixed_incomes"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_fixed_income_category" ON "fixed_incomes"("category_id");

-- CreateIndex
CREATE INDEX "idx_variable_income_user_month" ON "variable_incomes"("user_id", "month");

-- CreateIndex
CREATE INDEX "idx_variable_income_category" ON "variable_incomes"("category_id");

-- CreateIndex
CREATE INDEX "idx_vi_tags_income" ON "variable_income_tags"("variable_income_id");

-- CreateIndex
CREATE UNIQUE INDEX "variable_income_tags_variable_income_id_tag_key" ON "variable_income_tags"("variable_income_id", "tag");

-- CreateIndex
CREATE INDEX "idx_fixed_expense_user_active" ON "fixed_expenses"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_fixed_expense_category" ON "fixed_expenses"("category_id");

-- CreateIndex
CREATE INDEX "idx_variable_expense_user_month" ON "variable_expenses"("user_id", "month");

-- CreateIndex
CREATE INDEX "idx_variable_expense_category" ON "variable_expenses"("category_id");

-- CreateIndex
CREATE INDEX "idx_ve_tags_expense" ON "variable_expense_tags"("variable_expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "variable_expense_tags_variable_expense_id_tag_key" ON "variable_expense_tags"("variable_expense_id", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_budgets_user_id_month_key" ON "monthly_budgets"("user_id", "month");

-- CreateIndex
CREATE INDEX "idx_budget_line_budget" ON "budget_lines"("budget_id");

-- CreateIndex
CREATE UNIQUE INDEX "budget_lines_budget_id_category_id_key" ON "budget_lines"("budget_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_funds_user_id_key" ON "emergency_funds"("user_id");

-- CreateIndex
CREATE INDEX "idx_efm_fund" ON "emergency_fund_movements"("fund_id");

-- CreateIndex
CREATE INDEX "idx_efm_date" ON "emergency_fund_movements"("date");

-- CreateIndex
CREATE INDEX "idx_investment_user" ON "investment_positions"("user_id");

-- CreateIndex
CREATE INDEX "idx_investment_type" ON "investment_positions"("type");

-- CreateIndex
CREATE INDEX "idx_im_position" ON "investment_movements"("position_id");

-- CreateIndex
CREATE INDEX "idx_im_position_date" ON "investment_movements"("position_id", "date");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_incomes" ADD CONSTRAINT "fixed_incomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_incomes" ADD CONSTRAINT "fixed_incomes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variable_incomes" ADD CONSTRAINT "variable_incomes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variable_incomes" ADD CONSTRAINT "variable_incomes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variable_income_tags" ADD CONSTRAINT "variable_income_tags_variable_income_id_fkey" FOREIGN KEY ("variable_income_id") REFERENCES "variable_incomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_expenses" ADD CONSTRAINT "fixed_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_expenses" ADD CONSTRAINT "fixed_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variable_expenses" ADD CONSTRAINT "variable_expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variable_expenses" ADD CONSTRAINT "variable_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variable_expense_tags" ADD CONSTRAINT "variable_expense_tags_variable_expense_id_fkey" FOREIGN KEY ("variable_expense_id") REFERENCES "variable_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_budgets" ADD CONSTRAINT "monthly_budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "monthly_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_funds" ADD CONSTRAINT "emergency_funds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_fund_movements" ADD CONSTRAINT "emergency_fund_movements_fund_id_fkey" FOREIGN KEY ("fund_id") REFERENCES "emergency_funds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_positions" ADD CONSTRAINT "investment_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_movements" ADD CONSTRAINT "investment_movements_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "investment_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
