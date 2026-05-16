import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCapture,
  createReading,
  getClientConfig,
  getDiscover,
  getLenses,
  getMe,
  getReading,
  getSlice,
  getSlices,
  login,
  retryReading,
  saveSlice,
  sendAuthCode,
  signout
} from "./endpoints";
import { queryKeys } from "./queryKeys";
import { useSessionStore } from "../stores/sessionStore";
import type { Reading } from "../schemas/domain";

export function useClientConfigQuery() {
  return useQuery({ queryKey: queryKeys.clientConfig, queryFn: getClientConfig, staleTime: 1000 * 60 * 20 });
}

export function useDiscoverQuery() {
  return useQuery({ queryKey: queryKeys.discover, queryFn: getDiscover, staleTime: 1000 * 30 });
}

export function useMeQuery(enabled = true) {
  return useQuery({ queryKey: queryKeys.me, queryFn: getMe, enabled, staleTime: 1000 * 60 });
}

export function useLensesQuery() {
  return useQuery({ queryKey: queryKeys.lenses, queryFn: getLenses, staleTime: 1000 * 60 * 5 });
}

export function useSlicesQuery() {
  return useQuery({ queryKey: queryKeys.slices, queryFn: getSlices, staleTime: 1000 * 15 });
}

export function useSliceQuery(sliceId?: string) {
  return useQuery({ queryKey: queryKeys.slice(sliceId || ""), queryFn: () => getSlice(sliceId!), enabled: Boolean(sliceId) });
}

export function useReadingQuery(readingId?: string) {
  return useQuery({
    queryKey: queryKeys.reading(readingId || ""),
    queryFn: () => getReading(readingId!),
    enabled: Boolean(readingId),
    refetchInterval: (query) => {
      const reading = query.state.data as Reading | undefined;
      if (!reading || reading.status === "queued" || reading.status === "processing") return reading?.pollAfterMs ?? 800;
      return false;
    }
  });
}

export function useSendCodeMutation() {
  return useMutation({ mutationFn: ({ target }: { target: string }) => sendAuthCode(target) });
}

export function useLoginMutation() {
  const session = useSessionStore();
  return useMutation({
    mutationFn: ({ target, code }: { target: string; code: string }) => login(target, code, session.deviceId),
    onSuccess: (data) => session.setAuth(data.accessToken, data.refreshToken, data.observer)
  });
}

export function useSignoutMutation() {
  const queryClient = useQueryClient();
  const session = useSessionStore();
  return useMutation({
    mutationFn: signout,
    onSettled: () => {
      session.clearAuth();
      queryClient.clear();
    }
  });
}

export function useCaptureMutation() {
  return useMutation({ mutationFn: createCapture });
}

export function useCreateReadingMutation() {
  return useMutation({ mutationFn: ({ captureId, lensId }: { captureId: string; lensId: string }) => createReading(captureId, lensId) });
}

export function useRetryReadingMutation() {
  return useMutation({ mutationFn: ({ readingId, lensId }: { readingId: string; lensId: string }) => retryReading(readingId, lensId) });
}

export function useSaveSliceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ readingId, isPublic }: { readingId: string; isPublic?: boolean }) => saveSlice(readingId, isPublic),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.slices })
  });
}
