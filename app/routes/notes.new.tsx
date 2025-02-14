import * as React from "react";

import type { ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useNavigation } from "@remix-run/react";
import { parseFormAny, useZorm } from "react-zorm";
import { z } from "zod";

import { requireAuthSession, commitAuthSession } from "~/modules/auth";
import { createNote } from "~/modules/note";
import { assertIsPost, isFormProcessing } from "~/utils";

export const NewNoteFormSchema = z.object({
	title: z.string().min(1, "require-title"),
	body: z.string().min(1, "require-body"),
});

export async function action({ request }: ActionFunctionArgs) {
	assertIsPost(request);
	const authSession = await requireAuthSession(request);
	const formData = await request.formData();
	const result = await NewNoteFormSchema.safeParseAsync(
		parseFormAny(formData),
	);

	if (!result.success) {
		return json(
			{
				errors: result.error,
			},
			{
				status: 400,
				headers: {
					"Set-Cookie": await commitAuthSession(request, {
						authSession,
					}),
				},
			},
		);
	}

	const { title, body } = result.data;

	const note = await createNote({ title, body, userId: authSession.userId });

	return redirect(`/notes/${note.id}`, {
		headers: {
			"Set-Cookie": await commitAuthSession(request, { authSession }),
		},
	});
}

export default function NewNotePage() {
	const zo = useZorm("NewQuestionWizardScreen", NewNoteFormSchema);
	const navigation = useNavigation();
	const disabled = isFormProcessing(navigation.state);

	return (
		<Form
			ref={zo.ref}
			method="post"
			className="flex w-full flex-col gap-[8px]"
		>
			<div>
				<label className="flex w-full flex-col gap-1">
					<span>Title: </span>
					<input
						name={zo.fields.title()}
						className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
						disabled={disabled}
					/>
				</label>
				{zo.errors.title()?.message && (
					<div className="pt-1 text-red-700" id="title-error">
						{zo.errors.title()?.message}
					</div>
				)}
			</div>

			<div>
				<label className="flex w-full flex-col gap-1">
					<span>Body: </span>
					<textarea
						name={zo.fields.body()}
						rows={8}
						className="w-full flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
						disabled={disabled}
					/>
				</label>
				{zo.errors.body()?.message && (
					<div className="pt-1 text-red-700" id="body-error">
						{zo.errors.body()?.message}
					</div>
				)}
			</div>

			<div className="text-right">
				<button
					type="submit"
					className="rounded bg-blue-500  px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
					disabled={disabled}
				>
					Save
				</button>
			</div>
		</Form>
	);
}
