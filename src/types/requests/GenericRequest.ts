export class GenericRequest<T> {
  public constructor(obj: T) {
    for (const key in obj) {
      if (typeof obj[key] !== 'object') {
        if (typeof obj[key] === 'string') {
          (this as unknown as T)[key] = (obj[key] as unknown as string).normalize() as unknown as T[Extract<
            keyof T,
            string
          >];
        } else {
          (this as unknown as T)[key] = obj[key];
        }
      }
    }
  }
}

export interface ParsedQs {
  [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[];
}
