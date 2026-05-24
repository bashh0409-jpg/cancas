"use client";

type SignOutNameButtonProps = {
  firstName: string;
  signOutAction: (formData: FormData) => void | Promise<void>;
};

export function SignOutNameButton({
  firstName,
  signOutAction,
}: SignOutNameButtonProps) {
  return (
    <form
      action={signOutAction}
      className="inline"
      onSubmit={(event) => {
        const confirmed = window.confirm("Are you sure you want to sign out?");

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="cursor-pointer underline-offset-4 hover:underline"
      >
        {firstName}
      </button>
    </form>
  );
}
