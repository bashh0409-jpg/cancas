"use client";

type SignOutNameButtonProps = {
  firstName: string;
  lastName: string;
  fullName?: string;
  signOutAction: (formData: FormData) => void | Promise<void>;
};

export function SignOutNameButton({
  firstName,
  lastName,
  fullName: userFullName,

  signOutAction,
}: SignOutNameButtonProps) {
  const fullName = userFullName || `${firstName} ${lastName}`;

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
        {fullName}
      </button>
    </form>
  );
}
