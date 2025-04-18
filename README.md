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

## Environment Configuration

This application requires a few environment variables to be set in a `.env` or `.env.local` file:

```bash
# External API configuration
API_URL=http://your-api-url/api/jobs
ALLOWED_ORIGIN=http://localhost:3000
API_KEY="your-api-key-here"

# Job scheduler configuration
SCHEDULED_JOB_TIME=00:20
```

Refer to `.env.example` for a full list of environment variables.

## Job Scheduler

The application includes a job scheduler that automatically fetches fresh job data at scheduled times. 

### Configuration

The scheduler runs once per day at the time specified in the `SCHEDULED_JOB_TIME` environment variable. The time should be in 24-hour format (HH:MM) and is based on Lagos, Nigeria timezone (UTC+1).

For example:
- `SCHEDULED_JOB_TIME=00:20` - Run at 12:20 AM
- `SCHEDULED_JOB_TIME=13:30` - Run at 1:30 PM

The scheduler:
1. Fetches job data from the external API
2. Processes the data
3. Stores it in a server-side JSON cache file
4. All client requests use this cached data until the next scheduled update

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
