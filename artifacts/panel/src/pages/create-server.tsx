import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateServer } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
const formSchema = z.object({
  name: z.string().min(1, "Server name is required").max(64),
  software: z.enum(["paper", "leaf", "fabric"]),
  version: z.enum(["1.21.4", "1.20.4", "1.20.1", "1.19.4"]),
  plan: z.enum(["free", "premium", "enterprise"]),
});

export default function CreateServer() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const params = new URLSearchParams(search);
  const planFromUrl = params.get("plan");
  const defaultPlan = ["free", "premium", "enterprise"].includes(planFromUrl ?? "")
    ? (planFromUrl as "free" | "premium" | "enterprise")
    : "free";

  const createServer = useCreateServer();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      software: "paper",
      version: "1.21.4",
      plan: defaultPlan,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createServer.mutate({ data: values }, {
      onSuccess: (server) => {
        toast({
          title: "Node deployed",
          description: `Server ${server.name} is provisioning.`,
        });
        setLocation(`/servers/${server.id}`);
      },
      onError: () => {
        toast({
          title: "Deployment failed",
          description: "An error occurred while provisioning the node.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deploy New Node</h1>
        <p className="text-muted-foreground">Provision a new Minecraft server instance.</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Instance Configuration</CardTitle>
          <CardDescription>Select the software and resources for your new node.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instance Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. survival-prod-01" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="software"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Software Platform</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select software" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paper">Paper (Recommended)</SelectItem>
                          <SelectItem value="leaf">Leaf (High Performance)</SelectItem>
                          <SelectItem value="fabric">Fabric (Modded)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Version</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select version" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1.21.4">1.21.4</SelectItem>
                          <SelectItem value="1.20.4">1.20.4</SelectItem>
                          <SelectItem value="1.20.1">1.20.1</SelectItem>
                          <SelectItem value="1.19.4">1.19.4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resource Allocation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free (2GB RAM)</SelectItem>
                        <SelectItem value="premium">Premium (8GB RAM)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (16GB RAM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Higher plans unlock more player slots and better performance.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={createServer.isPending}>
                  {createServer.isPending ? "Provisioning..." : "Deploy Instance"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}