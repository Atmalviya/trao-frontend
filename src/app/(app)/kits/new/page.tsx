import { CreateKitForm } from "@/components/create-kit-form";

export default function NewKitPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-3">
      <div className="shrink-0">
        <h1 className="text-xl font-bold tracking-tight">New kit</h1>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
          One role at a time, or upload several to prep in parallel
        </p>
      </div>
      <CreateKitForm />
    </div>
  );
}
