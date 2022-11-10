import { defer } from './defer';
import type { WriteResponse } from './types';

const isRedirect = ({ status = 0 }) => status >= 300 && status < 400;

export function useSsrResponse() {
  const deferred = defer<WriteResponse>();
  const response = {} as WriteResponse;

  const writeResponse = (params: WriteResponse) => {
    Object.assign(response, params);
    if (isRedirect(params)) {
      // Stop waiting for rendering when redirecting
      deferred.resolve(response);
    }
  };

  return {
    deferred,
    response,
    writeResponse,
    isRedirect: () => isRedirect(response),
    redirect: (location: string, status = 302) =>
      writeResponse({ headers: { location }, status }),
  };
}
