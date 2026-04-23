import { Button } from "../components/button";
import { Card } from "../components/card";
import { TextInput } from "../components/input";
import { useNavigate, useSearchParams } from "react-router";
import { useState, type SubmitEvent } from "react";
import { createSession } from "../lib/server";

export function Home() {
    const [query] = useSearchParams();
    const [code, setCode] = useState(() => query.get("code") ?? "");
    const navigate = useNavigate();

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        await createSession(code);

        navigate("/test");
    }

    return (
        <div className="flex h-screen w-full items-center justify-center p-8">
            <div className="flex flex-col gap-8">
                <div className="text-center">
                    <h1 className="text-5xl font-medium">Verio</h1>
                    <div className="text-xl">
                        Candidate testing for the AI age
                    </div>
                </div>
                <Card>
                    <form
                        className="flex flex-col gap-2"
                        onSubmit={handleSubmit}>
                        <div>
                            <h2>Enter code</h2>
                            <TextInput value={code} onChange={setCode} />
                        </div>
                        <Button type="submit" className="justify-center">
                            Start test
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
