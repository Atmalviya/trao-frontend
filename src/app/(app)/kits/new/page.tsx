import { CreateKitForm } from "@/components/create-kit-form";

export default function NewKitPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New kit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One role at a time, or upload several to prep in parallel
        </p>
      </div>
      <CreateKitForm />
    </div>
  );
}
