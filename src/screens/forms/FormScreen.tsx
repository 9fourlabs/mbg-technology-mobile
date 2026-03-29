import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { FormDefinition, FormField } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";
import { useFormSubmit } from "../../hooks/forms/useFormSubmit";

type Props = {
  formDef: FormDefinition;
  theme: Theme;
  onSuccess: () => void;
};

export function FormScreen({ formDef, theme, onSuccess }: Props) {
  const { submit, loading } = useFormSubmit();
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectOpen, setSelectOpen] = useState<string | null>(null);

  function setValue(fieldId: string, value: any) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const field of formDef.fields) {
      if (field.required) {
        const val = values[field.id];
        if (val === undefined || val === null || val === "" || val === false) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const result = await submit({ formId: formDef.id, data: values });
    if (result) {
      Alert.alert("Success", "Your form has been submitted.", [
        { text: "OK", onPress: onSuccess },
      ]);
    }
  }

  function renderField(field: FormField) {
    const hasError = !!errors[field.id];
    const borderColor = hasError ? "#e53e3e" : theme.primary + "40";

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <TextInput
            style={[styles.input, { color: theme.text, borderColor }]}
            placeholderTextColor={theme.mutedText}
            placeholder={field.placeholder ?? field.label}
            value={values[field.id] ?? ""}
            onChangeText={(text) => setValue(field.id, text)}
            keyboardType={
              field.type === "email" ? "email-address" : field.type === "phone" ? "phone-pad" : "default"
            }
            autoCapitalize={field.type === "email" ? "none" : "sentences"}
          />
        );

      case "textarea":
        return (
          <TextInput
            style={[styles.input, styles.textarea, { color: theme.text, borderColor }]}
            placeholderTextColor={theme.mutedText}
            placeholder={field.placeholder ?? field.label}
            value={values[field.id] ?? ""}
            onChangeText={(text) => setValue(field.id, text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );

      case "select":
        return (
          <View>
            <Pressable
              style={[styles.input, styles.selectTrigger, { borderColor }]}
              onPress={() => setSelectOpen(selectOpen === field.id ? null : field.id)}
            >
              <Text style={{ color: values[field.id] ? theme.text : theme.mutedText }}>
                {field.options?.find((o) => o.value === values[field.id])?.label ??
                  field.placeholder ??
                  "Select an option"}
              </Text>
            </Pressable>
            {selectOpen === field.id && (
              <View style={[styles.optionsList, { borderColor: theme.primary + "30" }]}>
                {(field.options ?? []).map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.optionItem,
                      values[field.id] === option.value && {
                        backgroundColor: theme.primary + "20",
                      },
                    ]}
                    onPress={() => {
                      setValue(field.id, option.value);
                      setSelectOpen(null);
                    }}
                  >
                    <Text style={{ color: theme.text }}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );

      case "checkbox":
        return (
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setValue(field.id, !values[field.id])}
          >
            <Text style={[styles.checkboxIcon, { color: theme.primary }]}>
              {values[field.id] ? "\u2611" : "\u2610"}
            </Text>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>{field.label}</Text>
          </Pressable>
        );

      case "date":
        return (
          <TextInput
            style={[styles.input, { color: theme.text, borderColor }]}
            placeholderTextColor={theme.mutedText}
            placeholder={field.placeholder ?? "YYYY-MM-DD"}
            value={values[field.id] ?? ""}
            onChangeText={(text) => setValue(field.id, text)}
          />
        );

      case "file":
        return (
          <View style={[styles.filePlaceholder, { borderColor }]}>
            <Text style={{ color: theme.mutedText }}>File upload coming soon</Text>
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: theme.text }]}>{formDef.title}</Text>
      {formDef.description ? (
        <Text style={[styles.description, { color: theme.mutedText }]}>{formDef.description}</Text>
      ) : null}

      {formDef.fields.map((field) => (
        <View key={field.id} style={styles.fieldContainer}>
          {field.type !== "checkbox" && (
            <Text style={[styles.label, { color: theme.text }]}>
              {field.label}
              {field.required ? <Text style={styles.required}> *</Text> : null}
            </Text>
          )}
          {renderField(field)}
          {errors[field.id] ? (
            <Text style={styles.errorText}>{errors[field.id]}</Text>
          ) : null}
        </View>
      ))}

      <Pressable
        style={[styles.submitButton, { backgroundColor: theme.primary }, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitText}>Submit</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  required: {
    color: "#e53e3e",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textarea: {
    minHeight: 100,
  },
  selectTrigger: {
    justifyContent: "center",
  },
  optionsList: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
    overflow: "hidden",
  },
  optionItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 15,
  },
  filePlaceholder: {
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});
