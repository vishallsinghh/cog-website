import { db } from "../src/lib/db";
import {
    formDefinitionSchema,
    formMetaSchema,
    type FieldOf,
    type FormField,
    type FormMeta,
    type FormSection,
    type LocalizedText,
    type PrefillSource,
} from "../src/lib/forms/definition";

const text = (en: string, gu: string): LocalizedText => ({ en, gu });

type Extra = { required?: boolean; help?: LocalizedText };

const short = (id: string, label: LocalizedText, extra: Extra & { prefill?: PrefillSource } = {}): FormField => ({
    id,
    type: "short_text",
    label,
    required: extra.required ?? true,
    ...extra,
});

const long = (id: string, label: LocalizedText, extra: Extra = {}): FormField => ({
    id,
    type: "long_text",
    label,
    required: extra.required ?? true,
    ...extra,
});

const number = (
    id: string,
    label: LocalizedText,
    extra: Extra & Partial<Pick<FieldOf<"number">, "min" | "max" | "integer" | "money">> = {},
): FieldOf<"number"> => ({
    id,
    type: "number",
    label,
    required: extra.required ?? true,
    ...extra,
});

const money = (id: string, label: LocalizedText, extra: Extra & { min?: number } = {}) =>
    number(id, label, { min: 0, money: true, ...extra });

const date = (id: string, label: LocalizedText, extra: Extra = {}): FieldOf<"date"> => ({
    id,
    type: "date",
    label,
    required: extra.required ?? true,
    ...extra,
});

const choice = (
    id: string,
    label: LocalizedText,
    options: [string, LocalizedText][],
    extra: Extra = {},
): FieldOf<"choice"> => ({
    id,
    type: "choice",
    label,
    required: extra.required ?? true,
    options: options.map(([value, optionLabel]) => ({ value, label: optionLabel })),
    ...extra,
});

const yesNo = (id: string, label: LocalizedText, extra: Extra = {}): FormField => ({
    id,
    type: "yes_no",
    label,
    required: extra.required ?? true,
    ...extra,
});

const document = (id: string, label: LocalizedText, extra: Extra & { maxFiles?: number } = {}): FormField => ({
    id,
    type: "document",
    label,
    required: extra.required ?? true,
    maxFiles: extra.maxFiles ?? 3,
    help: extra.help,
});

const section = (id: string, title: LocalizedText, fields: FormField[], description?: LocalizedText): FormSection => ({
    id,
    title,
    description,
    fields,
});

const applicantSection = section(
    "applicant",
    text("Applicant details", "અરજદારની વિગતો"),
    [
        short("applicant_name", text("Applicant's full name", "અરજદારનું પૂરું નામ"), { prefill: "name" }),
        short("mobile", text("Mobile number", "મોબાઇલ નંબર"), { prefill: "phoneNumber" }),
        short("address_line1", text("Address", "સરનામું"), { prefill: "addressLine1" }),
        short("address_line2", text("Address line 2", "સરનામું (લાઇન 2)"), { prefill: "addressLine2", required: false }),
        short("city", text("City", "શહેર"), { prefill: "city" }),
        short("pincode", text("Pincode", "પિનકોડ"), { prefill: "pincode" }),
        short("jamaat", text("Jamaat", "જમાત"), { prefill: "jamaat" }),
    ],
    text(
        "These details come from your profile. Check them before you continue.",
        "આ વિગતો તમારી પ્રોફાઇલમાંથી લેવામાં આવી છે. આગળ વધતા પહેલાં તપાસી લો.",
    ),
);

const householdSection = section("household", text("Family and income", "પરિવાર અને આવક"), [
    {
        id: "family_members",
        type: "table",
        label: text("Family members living with you", "તમારી સાથે રહેતા પરિવારના સભ્યો"),
        required: true,
        minRows: 1,
        maxRows: 15,
        columns: [
            { id: "name", type: "short_text", label: text("Name", "નામ"), required: true },
            { id: "relation", type: "short_text", label: text("Relation", "સંબંધ"), required: true },
            { id: "age", type: "number", label: text("Age", "ઉંમર"), required: true, min: 0, max: 120, integer: true },
            { id: "occupation", type: "short_text", label: text("Occupation", "વ્યવસાય"), required: false },
            {
                id: "monthly_income",
                type: "number",
                label: text("Monthly income (₹)", "માસિક આવક (₹)"),
                required: false,
                min: 0,
                money: true,
            },
        ],
    },
    money("monthly_family_income", text("Total monthly family income (₹)", "પરિવારની કુલ માસિક આવક (₹)")),
    yesNo(
        "other_support",
        text(
            "Are you getting help for this from any other trust or government scheme?",
            "શું તમને આ માટે બીજા કોઈ ટ્રસ્ટ કે સરકારી યોજનામાંથી મદદ મળે છે?",
        ),
    ),
    long("other_support_details", text("If yes, give details", "જો હા, તો વિગત આપો"), { required: false }),
]);

const idProof = document("id_proof", text("Photo ID of the applicant", "અરજદારનું ફોટો ઓળખપત્ર"), {
    maxFiles: 2,
    help: text(
        "Voter ID, PAN card, driving licence or passport. Do not upload your Aadhaar card.",
        "મતદાર ઓળખપત્ર, પાન કાર્ડ, ડ્રાઇવિંગ લાઇસન્સ અથવા પાસપોર્ટ. આધાર કાર્ડ અપલોડ કરશો નહીં.",
    ),
});

const incomeProof = document("income_proof", text("Income certificate or salary slip", "આવકનો દાખલો અથવા પગાર સ્લિપ"), {
    required: false,
});

const amountRequested = money("amount_requested", text("Amount requested from COG (₹)", "COG પાસેથી માંગેલી રકમ (₹)"), {
    min: 10000,
});

const declarationSection = section("declaration", text("Declaration", "ઘોષણા"), [
    choice(
        "declaration",
        text(
            "I confirm that the information and documents I have given are true and complete.",
            "હું ખાતરી આપું છું કે મેં આપેલી માહિતી અને દસ્તાવેજો સાચા અને પૂરા છે.",
        ),
        [["agree", text("I agree", "હું સંમત છું")]],
    ),
]);

const standards: [string, LocalizedText][] = [
    ["pre_primary", text("Pre-primary", "પૂર્વ-પ્રાથમિક")],
    ...Array.from({ length: 12 }, (_, index): [string, LocalizedText] => [
        `std_${index + 1}`,
        text(`Std ${index + 1}`, `ધોરણ ${index + 1}`),
    ]),
];

const percentage = (id: string, label: LocalizedText) => number(id, label, { min: 0, max: 100, required: false });

type SeedForm = { meta: FormMeta; sections: FormSection[] };

const FORMS: SeedForm[] = [
    {
        meta: {
            slug: "education-assistance",
            code: "EDU",
            titleEn: "Education Assistance",
            titleGu: "શૈક્ષણિક સહાય",
            summaryEn: "School fees and study support",
            summaryGu: "શાળા ફી અને અભ્યાસ માટે સહાય",
        },
        sections: [
            applicantSection,
            section("student", text("Student details", "વિદ્યાર્થીની વિગતો"), [
                short("student_name", text("Student's full name", "વિદ્યાર્થીનું પૂરું નામ")),
                short("relation_to_applicant", text("Relation to applicant", "અરજદાર સાથે સંબંધ")),
                date("date_of_birth", text("Date of birth", "જન્મ તારીખ")),
                short("school_name", text("School name", "શાળાનું નામ")),
                short("school_city", text("School city", "શાળાનું શહેર")),
                choice("standard", text("Standard", "ધોરણ"), standards),
                short("academic_year", text("Academic year", "શૈક્ષણિક વર્ષ"), {
                    help: text("For example 2026-27", "ઉદાહરણ તરીકે 2026-27"),
                }),
                percentage("last_exam_percentage", text("Last exam result (%)", "છેલ્લી પરીક્ષાનું પરિણામ (%)")),
                money("annual_fees", text("Total fees for the year (₹)", "વર્ષની કુલ ફી (₹)")),
                amountRequested,
            ]),
            householdSection,
            section("documents", text("Documents", "દસ્તાવેજો"), [
                idProof,
                document("fee_receipt", text("Fee receipt or fee structure from the school", "શાળાની ફી રસીદ અથવા ફી માળખું")),
                document("last_marksheet", text("Last marksheet", "છેલ્લી માર્કશીટ")),
                incomeProof,
            ]),
            declarationSection,
        ],
    },
    {
        meta: {
            slug: "higher-education-loan",
            code: "HEL",
            titleEn: "Higher Education Loan",
            titleGu: "ઉચ્ચ શિક્ષણ લોન",
            summaryEn: "College and university support",
            summaryGu: "કૉલેજ અને યુનિવર્સિટી માટે સહાય",
        },
        sections: [
            applicantSection,
            section("student", text("Student and course", "વિદ્યાર્થી અને અભ્યાસક્રમ"), [
                short("student_name", text("Student's full name", "વિદ્યાર્થીનું પૂરું નામ")),
                short("relation_to_applicant", text("Relation to applicant", "અરજદાર સાથે સંબંધ")),
                date("date_of_birth", text("Date of birth", "જન્મ તારીખ")),
                short("course_name", text("Course", "અભ્યાસક્રમ"), {
                    help: text("For example B.Com, MBBS or Diploma in Engineering", "ઉદાહરણ તરીકે B.Com, MBBS અથવા એન્જિનિયરિંગ ડિપ્લોમા"),
                }),
                choice("course_level", text("Course level", "અભ્યાસક્રમનું સ્તર"), [
                    ["diploma", text("Diploma", "ડિપ્લોમા")],
                    ["undergraduate", text("Undergraduate", "સ્નાતક")],
                    ["postgraduate", text("Postgraduate", "અનુસ્નાતક")],
                    ["professional", text("Professional (medical, law, CA and similar)", "વ્યાવસાયિક (મેડિકલ, કાયદો, CA વગેરે)")],
                    ["other", text("Other", "અન્ય")],
                ]),
                short("institution_name", text("College or university", "કૉલેજ અથવા યુનિવર્સિટી")),
                short("institution_city", text("City of the college", "કૉલેજનું શહેર")),
                number("course_years", text("Length of the course (years)", "અભ્યાસક્રમનો સમયગાળો (વર્ષ)"), {
                    min: 1,
                    max: 7,
                    integer: true,
                }),
                number("current_year", text("Current year of study", "અભ્યાસનું હાલનું વર્ષ"), { min: 1, max: 7, integer: true }),
                percentage("last_exam_percentage", text("Last exam result (%)", "છેલ્લી પરીક્ષાનું પરિણામ (%)")),
                money("total_fees", text("Total course fees (₹)", "અભ્યાસક્રમની કુલ ફી (₹)")),
                amountRequested,
            ]),
            section("guarantor", text("Guarantor", "જામીનદાર"), [
                short("guarantor_name", text("Guarantor's full name", "જામીનદારનું પૂરું નામ")),
                short("guarantor_mobile", text("Guarantor's mobile number", "જામીનદારનો મોબાઇલ નંબર")),
                short("guarantor_relation", text("Relation to student", "વિદ્યાર્થી સાથે સંબંધ")),
                short("guarantor_occupation", text("Guarantor's occupation", "જામીનદારનો વ્યવસાય"), { required: false }),
            ]),
            householdSection,
            section("documents", text("Documents", "દસ્તાવેજો"), [
                idProof,
                document("admission_letter", text("Admission letter or college ID", "પ્રવેશ પત્ર અથવા કૉલેજ ઓળખપત્ર")),
                document("fee_structure", text("Fee structure from the college", "કૉલેજનું ફી માળખું")),
                document("last_marksheet", text("Last marksheet", "છેલ્લી માર્કશીટ")),
                incomeProof,
            ]),
            declarationSection,
        ],
    },
    {
        meta: {
            slug: "housing-assistance",
            code: "HOU",
            titleEn: "Housing Assistance",
            titleGu: "આવાસ સહાય",
            summaryEn: "Housing and home repair support",
            summaryGu: "ઘર અને ઘર સમારકામ માટે સહાય",
        },
        sections: [
            applicantSection,
            section("property", text("Housing need", "આવાસની જરૂરિયાત"), [
                choice("support_type", text("Type of help needed", "કેવા પ્રકારની મદદ જોઈએ છે"), [
                    ["repair", text("Repair", "સમારકામ")],
                    ["renovation", text("Renovation", "નવીનીકરણ")],
                    ["construction", text("New construction", "નવું બાંધકામ")],
                    ["rent", text("Rent or deposit", "ભાડું અથવા ડિપોઝિટ")],
                ]),
                choice("ownership", text("The house is", "ઘર"), [
                    ["owned", text("Owned by the family", "પરિવારની માલિકીનું")],
                    ["rented", text("Rented", "ભાડાનું")],
                    ["other", text("Other", "અન્ય")],
                ]),
                long("property_address", text("Address of the house", "ઘરનું સરનામું")),
                long("work_description", text("Describe the work or need", "કામ અથવા જરૂરિયાતનું વર્ણન કરો")),
                money("estimated_cost", text("Estimated cost (₹)", "અંદાજિત ખર્ચ (₹)")),
                amountRequested,
            ]),
            householdSection,
            section("documents", text("Documents", "દસ્તાવેજો"), [
                idProof,
                document("ownership_proof", text("Property papers or rent agreement", "મિલકતના કાગળો અથવા ભાડા કરાર")),
                document("cost_estimate", text("Contractor's quotation or estimate", "કોન્ટ્રાક્ટરનું ક્વોટેશન અથવા અંદાજ")),
                document("house_photos", text("Photos of the house", "ઘરના ફોટા"), { maxFiles: 5 }),
                incomeProof,
            ]),
            declarationSection,
        ],
    },
    {
        meta: {
            slug: "medical-sahay",
            code: "MED",
            titleEn: "Medical Sahay",
            titleGu: "તબીબી સહાય",
            summaryEn: "Treatment and hospital costs",
            summaryGu: "સારવાર અને હોસ્પિટલ ખર્ચ",
        },
        sections: [
            applicantSection,
            section("patient", text("Patient and treatment", "દર્દી અને સારવાર"), [
                short("patient_name", text("Patient's full name", "દર્દીનું પૂરું નામ")),
                short("relation_to_applicant", text("Relation to applicant", "અરજદાર સાથે સંબંધ")),
                number("patient_age", text("Patient's age", "દર્દીની ઉંમર"), { min: 0, max: 120, integer: true }),
                long("illness", text("Illness or condition", "બીમારી અથવા સ્થિતિ")),
                short("hospital_name", text("Hospital name", "હોસ્પિટલનું નામ")),
                short("hospital_city", text("Hospital city", "હોસ્પિટલનું શહેર")),
                choice("treatment_type", text("Type of treatment", "સારવારનો પ્રકાર"), [
                    ["surgery", text("Surgery", "ઓપરેશન")],
                    ["hospital_stay", text("Hospital stay", "હોસ્પિટલમાં દાખલ")],
                    ["ongoing", text("Ongoing treatment", "ચાલુ સારવાર")],
                    ["medicines", text("Medicines", "દવાઓ")],
                    ["tests", text("Tests and scans", "તપાસ અને સ્કેન")],
                ]),
                date("treatment_date", text("Date of treatment or admission", "સારવાર અથવા દાખલ થવાની તારીખ"), {
                    required: false,
                }),
                money("estimated_cost", text("Total treatment cost (₹)", "સારવારનો કુલ ખર્ચ (₹)")),
                yesNo(
                    "insured",
                    text(
                        "Is the patient covered by health insurance or a government scheme?",
                        "શું દર્દી આરોગ્ય વીમા અથવા સરકારી યોજનામાં આવરી લેવાયેલ છે?",
                    ),
                ),
                money("insurance_amount", text("Amount covered by insurance or scheme (₹)", "વીમા અથવા યોજના હેઠળ મળતી રકમ (₹)"), {
                    required: false,
                }),
                amountRequested,
            ]),
            householdSection,
            section("documents", text("Documents", "દસ્તાવેજો"), [
                idProof,
                document("medical_reports", text("Doctor's letter and medical reports", "ડૉક્ટરનો પત્ર અને મેડિકલ રિપોર્ટ"), {
                    maxFiles: 5,
                }),
                document("cost_estimate", text("Hospital estimate or bills", "હોસ્પિટલનો અંદાજ અથવા બિલ"), { maxFiles: 5 }),
                incomeProof,
            ]),
            declarationSection,
        ],
    },
    {
        meta: {
            slug: "sports-upliftment",
            code: "SPO",
            titleEn: "Sports Upliftment",
            titleGu: "રમતગમત ઉત્કર્ષ",
            summaryEn: "Support for athletes",
            summaryGu: "ખેલાડીઓ માટે સહાય",
        },
        sections: [
            applicantSection,
            section("athlete", text("Athlete details", "ખેલાડીની વિગતો"), [
                short("athlete_name", text("Athlete's full name", "ખેલાડીનું પૂરું નામ")),
                short("relation_to_applicant", text("Relation to applicant", "અરજદાર સાથે સંબંધ")),
                date("date_of_birth", text("Date of birth", "જન્મ તારીખ")),
                short("sport", text("Sport", "રમત")),
                choice("level", text("Highest level played", "રમેલું સૌથી ઊંચું સ્તર"), [
                    ["school", text("School or college", "શાળા અથવા કૉલેજ")],
                    ["district", text("District", "જિલ્લો")],
                    ["state", text("State", "રાજ્ય")],
                    ["national", text("National", "રાષ્ટ્રીય")],
                    ["international", text("International", "આંતરરાષ્ટ્રીય")],
                ]),
                long("achievements", text("Main achievements", "મુખ્ય સિદ્ધિઓ")),
                short("coach_or_academy", text("Coach or academy", "કોચ અથવા એકેડેમી"), { required: false }),
            ]),
            section("support", text("Support needed", "જરૂરી સહાય"), [
                choice("support_type", text("What is the support for?", "સહાય શેના માટે છે?"), [
                    ["equipment", text("Equipment and kit", "સાધનો અને કિટ")],
                    ["coaching", text("Coaching fees", "કોચિંગ ફી")],
                    ["travel", text("Travel for competitions", "સ્પર્ધા માટે મુસાફરી")],
                    ["nutrition", text("Diet and nutrition", "આહાર અને પોષણ")],
                    ["other", text("Other", "અન્ય")],
                ]),
                long("support_details", text("Describe what you need", "તમને શું જોઈએ છે તેનું વર્ણન કરો")),
                amountRequested,
            ]),
            householdSection,
            section("documents", text("Documents", "દસ્તાવેજો"), [
                idProof,
                document("certificates", text("Certificates and proof of achievements", "પ્રમાણપત્રો અને સિદ્ધિઓના પુરાવા"), {
                    maxFiles: 5,
                }),
                document("cost_estimate", text("Quotation or cost estimate", "ક્વોટેશન અથવા ખર્ચનો અંદાજ"), { required: false }),
                incomeProof,
            ]),
            declarationSection,
        ],
    },
    {
        meta: {
            slug: "widow-sahay",
            code: "WID",
            titleEn: "Widow Sahay",
            titleGu: "વિધવા સહાય",
            summaryEn: "Support for widows and families",
            summaryGu: "વિધવાઓ અને પરિવારો માટે સહાય",
        },
        sections: [
            applicantSection,
            section("widow", text("Widow details", "વિધવાની વિગતો"), [
                short("widow_name", text("Widow's full name", "વિધવાનું પૂરું નામ")),
                short("relation_to_applicant", text("Relation to applicant", "અરજદાર સાથે સંબંધ"), {
                    help: text("Write \"Self\" if you are applying for yourself", "તમે પોતાના માટે અરજી કરતા હો તો \"પોતે\" લખો"),
                }),
                short("husband_name", text("Late husband's full name", "સ્વર્ગસ્થ પતિનું પૂરું નામ")),
                date("date_of_death", text("Date of husband's death", "પતિના અવસાનની તારીખ")),
                choice("support_type", text("Type of help needed", "કેવા પ્રકારની મદદ જોઈએ છે"), [
                    ["monthly", text("Monthly support", "માસિક સહાય")],
                    ["one_time", text("One-time support", "એક વખતની સહાય")],
                    ["children_education", text("Children's education", "બાળકોનું શિક્ષણ")],
                    ["medical", text("Medical", "તબીબી")],
                ]),
                long("current_situation", text("Describe your current situation", "તમારી હાલની પરિસ્થિતિનું વર્ણન કરો")),
                money("amount_requested", text("Amount requested from COG (₹)", "COG પાસેથી માંગેલી રકમ (₹)"), {
                    required: false,
                }),
            ]),
            householdSection,
            section("documents", text("Documents", "દસ્તાવેજો"), [
                idProof,
                document("death_certificate", text("Husband's death certificate", "પતિનું મરણ પ્રમાણપત્ર")),
                incomeProof,
            ]),
            declarationSection,
        ],
    },
];

async function main() {
    for (const [position, seed] of FORMS.entries()) {
        const meta = formMetaSchema.parse(seed.meta);
        const definition = formDefinitionSchema.parse({ sections: seed.sections });

        const existing = await db.form.findUnique({
            where: { slug: meta.slug },
            include: { _count: { select: { versions: true } } },
        });

        const form = existing ?? (await db.form.create({ data: { ...meta, position, isOpen: false } }));

        if (existing && existing._count.versions > 0) {
            console.log(`Kept ${meta.code} ${meta.slug}: it already has questions`);
            continue;
        }

        await db.formVersion.create({
            data: {
                formId: form.id,
                version: 1,
                definition: JSON.stringify(definition),
                publishedAt: new Date(),
            },
        });

        await db.auditLog.create({
            data: { action: "seed.form.created", entityType: "form", entityId: form.id, metadata: JSON.stringify({ code: meta.code }) },
        });

        console.log(`Created ${meta.code} ${meta.slug}`);
    }
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => db.$disconnect());
