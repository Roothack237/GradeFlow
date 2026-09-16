This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Report cards & student status

* `npm run seed:form2form3` — fills the Form 2 / Form 3 dataset of the
  **2026/2027** academic year (students, parents, subject assignments, marks,
  attendance, teacher availability). Idempotent.
* `npm run verify:form2form3` — verifies that every Form 2 / Form 3 student has
  a mark for every assigned subject and sequence, and reports the totals.

Optional environment variables for the report-card letterhead (all default to
GradeFlow values when unset):

```
SCHOOL_NAME, SCHOOL_MOTTO, SCHOOL_ADDRESS, SCHOOL_PHONE, SCHOOL_EMAIL,
SCHOOL_MINISTRY, SCHOOL_PRINCIPAL_NAME, SCHOOL_ACADEMIC_MASTER_NAME
```

See `docs/STUDENT_STATUS_AND_REPORT_CARDS.md` for the full description.
