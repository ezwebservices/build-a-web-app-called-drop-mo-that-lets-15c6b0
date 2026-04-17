import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler';
import type { Handler } from 'aws-lambda';

type Event = {
  action: 'create' | 'delete';
  dropId: string;
  dropAtIso: string;
};

const client = new SchedulerClient({});

function atExpr(iso: string): string {
  const d = new Date(iso);
  return `at(${d.toISOString().slice(0, 19)})`;
}

export const handler: Handler<Event> = async (event) => {
  const role = process.env.SCHEDULER_ROLE_ARN ?? '';
  const dropArn = process.env.DROP_DAY_LAMBDA_ARN ?? '';
  const reminderArn = process.env.REMINDER_LAMBDA_ARN ?? '';
  const dropName = `drop-${event.dropId}-day`;
  const reminderName = `drop-${event.dropId}-reminder`;

  if (event.action === 'delete') {
    await Promise.allSettled([
      client.send(new DeleteScheduleCommand({ Name: dropName })),
      client.send(new DeleteScheduleCommand({ Name: reminderName })),
    ]);
    return { ok: true };
  }

  const dropAt = new Date(event.dropAtIso);
  const reminderAt = new Date(dropAt.getTime() - 24 * 3600 * 1000);

  await client.send(
    new CreateScheduleCommand({
      Name: reminderName,
      ScheduleExpression: atExpr(reminderAt.toISOString()),
      FlexibleTimeWindow: { Mode: 'OFF' },
      Target: {
        Arn: reminderArn,
        RoleArn: role,
        Input: JSON.stringify({ dropId: event.dropId, kind: 'reminder' }),
      },
    })
  );
  await client.send(
    new CreateScheduleCommand({
      Name: dropName,
      ScheduleExpression: atExpr(event.dropAtIso),
      FlexibleTimeWindow: { Mode: 'OFF' },
      Target: {
        Arn: dropArn,
        RoleArn: role,
        Input: JSON.stringify({ dropId: event.dropId, kind: 'dropday' }),
      },
    })
  );
  return { ok: true };
};
