import { MainContent } from "@src/app/MainContent";
import { StepHeader } from "@src/app/StepHeader";
import { createSchemaField, type SchemaField } from "@src/features/data";
import { schemaAtom } from "@src/features/edit/data";
import { SchemaFieldEditor } from "@src/features/edit/schema/SchemaFieldEditor";
import { Button } from "@src/shared/ui/Button";
import { EditableList } from "@src/shared/ui/EditableList";
import { useAtom } from "jotai";
import { navigate } from "vike/client/router";

// #############################################################################
// MARK: コンポーネント

/** スキーマの工程。CSV で受け取るカラムを並べて定義する。 */
export function SchemaPage() {
  const [schema, setSchema] = useAtom(schemaAtom);

  /** カラム1つを、同じ ID のものと置き換える。 */
  function updateField(value: SchemaField) {
    setSchema(current => ({
      ...current,
      fields: current.fields.map(field => (field.id === value.id ? value : field)),
    }));
  }

  /** 末尾にカラムを追加する。 */
  function addField() {
    const field = createSchemaField();
    setSchema(current => ({
      ...current,
      fields: [...current.fields, field],
    }));
  }

  return (
    <>
      <StepHeader
        title="スキーマ"
        description={
          <>
            CSVで受け取るカラムの名前とデータ型を定義します。カラム名は加工の{" "}
            <code className="font-mono">input</code> で使います。
          </>
        }
        onNext={() => navigate("/edit/transform")}
      />
      <MainContent>
        <section className="flex flex-wrap gap-4 pt-4">
          <Button
            icon="i-lucide-plus"
            label="項目を追加"
            size="md"
            className="pl-2 pr-4"
            onClick={addField}
          />
        </section>
        <section className="mt-4">
          <EditableList
            items={schema.fields}
            getKey={field => field.id}
            dataFactory={createSchemaField}
            label={(_, index) => `${index + 1}`}
            onChange={fields =>
              setSchema(current => ({
                ...current,
                fields,
              }))
            }
          >
            {field => {
              return <SchemaFieldEditor value={field} onChange={updateField} />;
            }}
          </EditableList>
        </section>
      </MainContent>
    </>
  );
}
