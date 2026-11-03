-- CreateTable
CREATE TABLE "form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleGu" TEXT NOT NULL,
    "summaryEn" TEXT NOT NULL,
    "summaryGu" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "form_version" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "definition" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "form_version_formId_fkey" FOREIGN KEY ("formId") REFERENCES "form" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "form_version_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "form_access" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "form_access_formId_fkey" FOREIGN KEY ("formId") REFERENCES "form" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "form_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT,
    "formId" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "answers" TEXT NOT NULL DEFAULT '{}',
    "jamaat" TEXT,
    "city" TEXT,
    "submittedAt" DATETIME,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "application_formId_fkey" FOREIGN KEY ("formId") REFERENCES "form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "application_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "form_version" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_event_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "application_event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_note_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "application" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "application_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_counter" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "form_slug_key" ON "form"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "form_code_key" ON "form"("code");

-- CreateIndex
CREATE UNIQUE INDEX "form_version_formId_version_key" ON "form_version"("formId", "version");

-- CreateIndex
CREATE INDEX "form_access_userId_idx" ON "form_access"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "form_access_formId_userId_key" ON "form_access"("formId", "userId");

-- CreateIndex
CREATE INDEX "application_formId_status_idx" ON "application"("formId", "status");

-- CreateIndex
CREATE INDEX "application_userId_idx" ON "application"("userId");

-- CreateIndex
CREATE INDEX "application_submittedAt_idx" ON "application"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "application_number_key" ON "application"("number");

-- CreateIndex
CREATE INDEX "application_document_applicationId_idx" ON "application_document"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "application_document_storageKey_key" ON "application_document"("storageKey");

-- CreateIndex
CREATE INDEX "application_event_applicationId_idx" ON "application_event"("applicationId");

-- CreateIndex
CREATE INDEX "application_note_applicationId_idx" ON "application_note"("applicationId");
