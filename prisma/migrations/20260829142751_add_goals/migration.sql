-- CreateEnum
CREATE TYPE "GoalMovementType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateTable
CREATE TABLE "goals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "icon" VARCHAR(60),
    "color" VARCHAR(7) NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "target_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_movements" (
    "id" SERIAL NOT NULL,
    "goal_id" INTEGER NOT NULL,
    "type" "GoalMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_goal_user" ON "goals"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "goals_user_id_name_key" ON "goals"("user_id", "name");

-- CreateIndex
CREATE INDEX "idx_gm_goal" ON "goal_movements"("goal_id");

-- CreateIndex
CREATE INDEX "idx_gm_goal_date" ON "goal_movements"("goal_id", "date");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_movements" ADD CONSTRAINT "goal_movements_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
