"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthFormError } from "@/features/auth/components/auth-form-error";
import { AuthFormField } from "@/features/auth/components/auth-form-field";
import {
  useChangePassword,
  useDeleteAccount,
  useUpdateCurrentUser,
} from "@/features/auth/hooks/use-account";
import {
  type ChangePasswordFormValues,
  changePasswordSchema,
  type DeleteAccountFormValues,
  deleteAccountSchema,
  type ProfileNameFormValues,
  profileNameSchema,
} from "@/features/auth/schemas";
import type { User } from "@/types/domain";

/**
 * Account self-service shared by the Shopper and Brand settings pages:
 * edit your name (`PATCH /users/me`) and change your password
 * (`POST /users/me/password`). Email and role stay read-only.
 */
function ProfileDetailsCard({ user }: { user: User }) {
  const updateMutation = useUpdateCurrentUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileNameFormValues>({
    resolver: zodResolver(profileNameSchema),
    values: { full_name: user.full_name ?? "" },
  });

  const onSubmit = handleSubmit((values) => updateMutation.mutate(values));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile details</CardTitle>
        <CardDescription>How your name appears across FitMirror.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <AuthFormField
            id="full_name"
            label="Name"
            autoComplete="name"
            error={errors.full_name}
            registration={register("full_name")}
          />
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user.email}</dd>
            <dt className="text-muted-foreground">Account type</dt>
            <dd className="font-medium capitalize">{user.role.replace("_", " ")}</dd>
          </dl>
          {updateMutation.isError && <AuthFormError error={updateMutation.error} />}
          {updateMutation.isSuccess && !isDirty && (
            <p role="status" className="text-sm text-success">
              Saved.
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            className="w-fit"
            isLoading={updateMutation.isPending}
            disabled={!isDirty}
          >
            Save name
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const changeMutation = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = handleSubmit((values) =>
    changeMutation.mutate(
      { current_password: values.current_password, new_password: values.new_password },
      { onSuccess: () => reset() },
    ),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Password</CardTitle>
        <CardDescription>
          Changing it keeps you signed in here and signs you out everywhere else.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <AuthFormField
            id="current_password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.current_password}
            registration={register("current_password")}
          />
          <AuthFormField
            id="new_password"
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.new_password}
            registration={register("new_password")}
          />
          <AuthFormField
            id="confirm_password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirm_password}
            registration={register("confirm_password")}
          />
          {changeMutation.isError && <AuthFormError error={changeMutation.error} />}
          {changeMutation.isSuccess && (
            <p role="status" className="text-sm text-success">
              Your password has been changed.
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            className="w-fit"
            isLoading={changeMutation.isPending}
          >
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** `POST /users/me/delete`. The password prompt doubles as the confirmation. */
function DeleteAccountCard({ extraWarning }: { extraWarning?: string }) {
  const deleteMutation = useDeleteAccount();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteAccountFormValues>({ resolver: zodResolver(deleteAccountSchema) });

  const onSubmit = handleSubmit((values) => deleteMutation.mutate(values.password));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delete account</CardTitle>
        <CardDescription>
          We&apos;ll sign you out and permanently delete your account, photos and try-ons after 30
          days. Log in before then to cancel.{extraWarning ? ` ${extraWarning}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <AuthFormField
            id="delete_account_password"
            label="Your password"
            type="password"
            autoComplete="current-password"
            error={errors.password}
            registration={register("password")}
          />
          {deleteMutation.isError && <AuthFormError error={deleteMutation.error} />}
          <Button
            type="submit"
            variant="destructive"
            className="w-fit"
            isLoading={deleteMutation.isPending}
          >
            Delete my account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { ChangePasswordCard, DeleteAccountCard, ProfileDetailsCard };
