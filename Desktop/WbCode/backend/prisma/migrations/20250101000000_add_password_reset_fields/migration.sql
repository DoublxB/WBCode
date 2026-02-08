-- AlterTable
ALTER TABLE `User` ADD COLUMN `passwordResetToken` VARCHAR(191) NULL,
    ADD COLUMN `passwordResetExpires` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_passwordResetToken_key` ON `User`(`passwordResetToken`);

















