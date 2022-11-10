export const deserializeState = <S>(state: string): S => {
  try {
    return JSON.parse(state || '{}') as S;
  } catch (error) {
    console.error('[SSR] On state deserialization -', error, state);
    return {} as S;
  }
};
