-- CreateTable
CREATE TABLE "fixed_income_settlements" (
    "id" SERIAL NOT NULL,
    "fixed_income_id" INTEGER NOT NULL,
    "month" CHAR(7) NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT true,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_income_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_expense_settlements" (
    "id" SERIAL NOT NULL,
    "fixed_expense_id" INTEGER NOT NULL,
    "month" CHAR(7) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_expense_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_fis_income" ON "fixed_income_settlements"("fixed_income_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_income_settlements_fixed_income_id_month_key" ON "fixed_income_settlements"("fixed_income_id", "month");

-- CreateIndex
CREATE INDEX "idx_fes_expense" ON "fixed_expense_settlements"("fixed_expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_expense_settlements_fixed_expense_id_month_key" ON "fixed_expense_settlements"("fixed_expense_id", "month");

-- AddForeignKey
ALTER TABLE "fixed_income_settlements" ADD CONSTRAINT "fixed_income_settlements_fixed_income_id_fkey" FOREIGN KEY ("fixed_income_id") REFERENCES "fixed_incomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_expense_settlements" ADD CONSTRAINT "fixed_expense_settlements_fixed_expense_id_fkey" FOREIGN KEY ("fixed_expense_id") REFERENCES "fixed_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
