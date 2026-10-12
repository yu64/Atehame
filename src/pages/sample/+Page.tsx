import { MainContent } from "@src/app/MainContent";
import { PageFrame } from "@src/app/PageFrame";
import { isDarkAtom } from "@src/app/store";
import { Collapse } from "@src/shared/ui/Collapse";
import { Input } from "@src/shared/ui/Input";
import { Select } from "@src/shared/ui/Select";
import { SelectCard } from "@src/shared/ui/SelectCard";
import { useAtom } from "jotai";
import { useEffect } from "react";

export default function Page() {
  const [dark, setDark] = useAtom(isDarkAtom);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <PageFrame>
      <header></header>
      <MainContent>
        <div className="flex flex-col gap-4 w-full">
          <section className="border-b border-border-subtle pb-4">
            <button onClick={() => setDark(d => !d)} className="atehame-btn-primary">
              Toggle Dark Mode
            </button>
            <button onClick={() => setDark(d => !d)} className="atehame-btn-secondary">
              Toggle Dark Mode
            </button>
          </section>
          <section className="border-b border-border-subtle pb-4">
            <SelectCard
              title="Select Card"
              description="This is a select card component."
              buttonText="Click Me"
              onClick={() => alert("Card Clicked!")}
            />
          </section>
          <section className="border-b border-border-subtle pb-4">
            <Collapse title="Collapsible Section">
              <p>This is the content inside the collapsible section.</p>
            </Collapse>
          </section>
          <section className="border-b border-border-subtle pb-4">
            <Input
              type="text"
              label="Input Label"
              description="This is an input field."
              placeholder="Enter text here"
            />
          </section>
          <section className="border-b border-border-subtle pb-4">
            <Select value="">
              <option value="" disabled>
                Select an option
              </option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
              <option value="option3">Option 3</option>
            </Select>
          </section>
        </div>
      </MainContent>
      <footer></footer>
    </PageFrame>
  );
}
