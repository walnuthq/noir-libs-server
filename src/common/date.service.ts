import * as dayjs from 'dayjs';

export const addDaysToNowGetDate = (days: number): Date => {
    return dayjs().add(days, 'day').toDate();
};

export const isExpired = (date: Date): boolean => {
    return dayjs(date).isBefore(dayjs());
};