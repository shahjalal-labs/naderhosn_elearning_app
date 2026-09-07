# 📁 Project Structure

```bash
.
├── bun.lock
├── ecosystem.config.js
├── module.js
├── package.json
├── package-lock.json
├── prisma
│   └── schema.prisma
├── public
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── README.md
├── src
│   ├── app
│   │   ├── builder
│   │   │   ├── QueryBuilderForService.ts
│   │   │   └── QueryBuilder.ts
│   │   ├── constant
│   │   │   └── index.ts
│   │   ├── DB
│   │   │   └── index.ts
│   │   ├── interfaces
│   │   │   ├── common.ts
│   │   │   └── file.ts
│   │   ├── middlewares
│   │   │   ├── auth.ts
│   │   │   ├── globalErrorHandler.ts
│   │   │   ├── optionalAuth.ts
│   │   │   ├── parseBodyData.ts
│   │   │   ├── postman.ts
│   │   │   ├── rateLimiter
│   │   │   └── validateRequest.ts
│   │   ├── modules
│   │   │   ├── announcement
│   │   │   │   ├── announcement.controller.ts
│   │   │   │   ├── announcement.routes.ts
│   │   │   │   ├── announcement.service.ts
│   │   │   │   └── announcement.validation.ts
│   │   │   ├── assignment
│   │   │   │   ├── assignment.controller.ts
│   │   │   │   ├── assignment.routes.ts
│   │   │   │   ├── assignment.service.ts
│   │   │   │   └── assignment.validation.ts
│   │   │   ├── auth
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.validation.ts
│   │   │   ├── book
│   │   │   │   ├── book.controller.ts
│   │   │   │   ├── book.routes.ts
│   │   │   │   ├── book.service.ts
│   │   │   │   ├── book.validation.ts
│   │   │   │   └── const.ts
│   │   │   ├── grades
│   │   │   │   ├── grade.const.ts
│   │   │   │   ├── grades.controller.ts
│   │   │   │   ├── grades.routes.ts
│   │   │   │   ├── grades.service.ts
│   │   │   │   └── grades.validation.ts
│   │   │   ├── notifications
│   │   │   │   ├── notification.controller.ts
│   │   │   │   ├── notification.route.ts
│   │   │   │   └── notification.services.ts
│   │   │   ├── resource
│   │   │   │   ├── resource.controller.ts
│   │   │   │   ├── resource.routes.ts
│   │   │   │   ├── resource.service.ts
│   │   │   │   └── resource.validation.ts
│   │   │   ├── school
│   │   │   │   ├── school.controller.ts
│   │   │   │   ├── school.routes.ts
│   │   │   │   ├── school.service.ts
│   │   │   │   └── school.validation.ts
│   │   │   ├── studentgrade
│   │   │   │   ├── studentGrade.const.ts
│   │   │   │   ├── studentGrade.controller.ts
│   │   │   │   ├── studentGrade.routes.ts
│   │   │   │   └── studentGrade.service.ts
│   │   │   ├── teachergrade
│   │   │   │   ├── teacherGradeConst.ts
│   │   │   │   ├── teacherGrade.controller.ts
│   │   │   │   ├── teacherGrade.routes.ts
│   │   │   │   └── teacherGrade.service.ts
│   │   │   └── user
│   │   │       ├── const.ts
│   │   │       ├── user.controller.ts
│   │   │       ├── user.route.ts
│   │   │       ├── user.services.ts
│   │   │       └── user.validation.ts
│   │   └── routes
│   │       ├── index.ts
│   │       └── viewRoute.ts
│   ├── app.ts
│   ├── bullBoard.ts
│   ├── config
│   │   ├── index.ts
│   │   └── serviceAccount.ts
│   ├── constant
│   │   └── index.ts
│   ├── errors
│   │   ├── ApiErrors.ts
│   │   ├── handleClientError.ts
│   │   ├── handleValidationError.ts
│   │   ├── handleZodError.ts
│   │   └── parsePrismaValidationError.ts
│   ├── helpers
│   │   ├── cron.ts
│   │   ├── fileUploader.ts
│   │   ├── fileUploadHelper.ts
│   │   ├── generateOnboardingUrl.ts
│   │   ├── generateOtp.ts
│   │   ├── getModelKeys.ts
│   │   ├── haversineDistance.ts
│   │   ├── jwtHelpers.ts
│   │   ├── prismaEvreyWhere.ts
│   │   ├── radis.ts
│   │   ├── sendEmail.ts
│   │   ├── stripe.ts
│   │   ├── uploadToDigitalOceanAWS.ts
│   │   └── userDelete.ts
│   ├── interfaces
│   │   ├── common.ts
│   │   ├── error.ts
│   │   ├── file.ts
│   │   ├── index.d.ts
│   │   └── paginations.ts
│   ├── queue
│   │   ├── email.queue.ts
│   │   ├── notification.queue.ts
│   │   ├── queue.helpers.ts
│   │   └── users.queue.ts
│   ├── server.ts
│   ├── shared
│   │   ├── catchAsync.ts
│   │   ├── firebase.admin.ts
│   │   ├── pagination.ts
│   │   ├── pick.ts
│   │   ├── prisma.ts
│   │   ├── searchFilter.ts
│   │   ├── sendResponse.ts
│   │   └── UploadHelper.ts
│   └── workers
│       ├── email.worker.ts
│       ├── notification.worker.ts
│       └── users.worker.ts
├── tsconfig.json
├── uploads
│   └── google.png
└── vercel.json

32 directories, 119 files

```
