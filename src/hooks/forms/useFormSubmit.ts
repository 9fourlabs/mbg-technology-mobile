import { useSupabaseMutation } from "../useSupabaseMutation";
import { useAuth } from "../../auth/AuthProvider";

type FormSubmitInput = {
  formId: string;
  data: Record<string, any>;
  attachments?: string[];
};

type FormSubmitOutput = {
  id: string;
  form_id: string;
  data: Record<string, any>;
  status: string;
  created_at: string;
};

export function useFormSubmit() {
  const { user } = useAuth();

  const { mutate, loading, error } = useSupabaseMutation<FormSubmitInput, FormSubmitOutput>(
    (supabase, input) =>
      supabase
        .from("form_submissions")
        .insert({
          user_id: user?.id,
          form_id: input.formId,
          data: input.data,
          attachments: input.attachments ?? [],
          status: "submitted",
        })
        .select()
        .single()
  );

  return {
    submit: (input: FormSubmitInput) => mutate(input),
    loading,
    error,
  };
}
