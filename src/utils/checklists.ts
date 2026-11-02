export interface ChecklistTemplateItem {
  key: string;
  label: string;
  labelKn: string;
  isMandatory: boolean;
  notes?: string;
}

export interface RTOServiceDefinition {
  type: string;
  label: string;
  labelKn: string;
  description: string;
  checklist: ChecklistTemplateItem[];
}

export const RTO_SERVICES: RTOServiceDefinition[] = [
  {
    type: 'tractor_registration',
    label: 'Tractor Registration (Agricultural / Commercial)',
    labelKn: 'ಟ್ರಾಕ್ಟರ್ ನೋಂದಣಿ (ಕೃಷಿ / ವಾಣಿಜ್ಯ)',
    description: 'Registration of new agricultural or commercial tractor in Karnataka RTO',
    checklist: [
      { key: 'form_20', label: 'Form 20 (Application for Registration)', labelKn: 'ಫಾರ್ಮ್ 20 (ನೋಂದಣಿ ಅರ್ಜಿ)', isMandatory: true },
      { key: 'form_21', label: 'Form 21 (Sale Certificate from Tractor Dealership)', labelKn: 'ಫಾರ್ಮ್ 21 (ಮಾರಾಟ ಪ್ರಮಾಣಪತ್ರ)', isMandatory: true },
      { key: 'form_22', label: 'Form 22 (Roadworthiness Certificate from Tractor OEM)', labelKn: 'ಫಾರ್ಮ್ 22 (ರಸ್ತೆ ಯೋಗ್ಯತೆ ಪ್ರಮಾಣಪತ್ರ)', isMandatory: true },
      { key: 'showroom_invoice', label: 'Tractor Showroom Invoice Copy', labelKn: 'ಟ್ರಾಕ್ಟರ್ ಶೋರೂಮ್ ಇನ್ವಾಯ್ಸ್ ಪ್ರತಿ', isMandatory: true },
      { key: 'insurance', label: 'Tractor Commercial/Agri Insurance Policy', labelKn: 'ಟ್ರಾಕ್ಟರ್ ವಿಮಾ ಪಾಲಿಸಿ', isMandatory: true },
      { key: 'road_tax_receipt', label: 'Karnataka Road Tax / Registration Fee Receipt', labelKn: 'ಕರ್ನಾಟಕ ರಸ್ತೆ ತೆರಿಗೆ / ನೋಂದಣಿ ಶುಲ್ಕ ರಶೀದಿ', isMandatory: true },
      { key: 'agri_tax_exemption', label: 'Farmer Land Record (Pahani/RTC) for Agri Tax Exemption', labelKn: 'ಕೃಷಿ ತೆರಿಗೆ ವಿನಾಯಿತಿಗಾಗಿ ಪಹಣಿ / ಆರ್‌ಟಿಸಿ ದಾಖಲೆ', isMandatory: false },
      { key: 'aadhaar', label: 'Farmer / Owner Aadhaar & Address Proof', labelKn: 'ರೈತರ/ಮಾಲೀಕರ ಆಧಾರ್ ಮತ್ತು ವಿಳಾಸ ಪುರಾವೆ', isMandatory: true },
      { key: 'chassis_pencil_print', label: 'Tractor Chassis Pencil Print Trace', labelKn: 'ಟ್ರಾಕ್ಟರ್ ಚಾಸಿಸ್ ಪೆನ್ಸಿಲ್ ಪ್ರಿಂಟ್', isMandatory: true },
    ],
  },
  {
    type: 'tractor_exchange',
    label: 'Tractor Exchange Paperwork & Transfer',
    labelKn: 'ಟ್ರಾಕ್ಟರ್ ಎಕ್ಸ್ಚೇಂಜ್ ಕಾಗದಪತ್ರ ಮತ್ತು ವರ್ಗಾವಣೆ',
    description: 'Handover and paperwork for old tractor trade-in and new tractor registration',
    checklist: [
      { key: 'form_29', label: 'Form 29 (Notice of Transfer of Old Tractor)', labelKn: 'ಫಾರ್ಮ್ 29 (ಹಳೆಯ ಟ್ರಾಕ್ಟರ್ ವರ್ಗಾವಣೆ ನೋಟಿಸ್)', isMandatory: true },
      { key: 'form_30', label: 'Form 30 (Intimation of Transfer of Old Tractor)', labelKn: 'ಫಾರ್ಮ್ 30 (ಮಾಲೀಕತ್ವ ಬದಲಾವಣೆ ಅರ್ಜಿ)', isMandatory: true },
      { key: 'original_rc', label: 'Original RC of Old Tractor', labelKn: 'ಹಳೆಯ ಟ್ರಾಕ್ಟರ್ ಮೂಲ ಆರ್‌ಸಿ', isMandatory: true },
      { key: 'form_35', label: 'Form 35 / Bank NOC (if loan closed on old tractor)', labelKn: 'ಫಾರ್ಮ್ 35 / ಬ್ಯಾಂಕ್ ಎನ್‌ಒಸಿ', isMandatory: false },
      { key: 'exchange_handover_receipt', label: 'Tractor Exchange Handover & Delivery Paperwork', labelKn: 'ಟ್ರಾಕ್ಟರ್ ಹಸ್ತಾಂತರ ಕಾಗದಪತ್ರ', isMandatory: true },
      { key: 'new_tractor_form21', label: 'Form 21 for New Delivered Tractor', labelKn: 'ಹೊಸ ಟ್ರಾಕ್ಟರ್ ಫಾರ್ಮ್ 21', isMandatory: true },
      { key: 'insurance', label: 'Insurance Policy for New Tractor', labelKn: 'ಹೊಸ ಟ್ರಾಕ್ಟರ್ ವಿಮೆ', isMandatory: true },
    ],
  },
  {
    type: 'new_registration',
    label: 'New Vehicle Registration',
    labelKn: 'ಹೊಸ ವಾಹನ ನೋಂದಣಿ',
    description: 'Registration of newly purchased vehicle in Karnataka RTO',
    checklist: [
      { key: 'form_20', label: 'Form 20 (Application for Registration)', labelKn: 'ಫಾರ್ಮ್ 20 (ನೋಂದಣಿ ಅರ್ಜಿ)', isMandatory: true },
      { key: 'form_21', label: 'Form 21 (Sale Certificate from Showroom)', labelKn: 'ಫಾರ್ಮ್ 21 (ಮಾರಾಟ ಪ್ರಮಾಣಪತ್ರ)', isMandatory: true },
      { key: 'form_22', label: 'Form 22 (Roadworthiness Certificate from OEM)', labelKn: 'ಫಾರ್ಮ್ 22 (ರಸ್ತೆ ಯೋಗ್ಯತೆ ಪ್ರಮಾಣಪತ್ರ)', isMandatory: true },
      { key: 'showroom_invoice', label: 'Showroom Invoice Copy (Reference)', labelKn: 'ಶೋರೂಮ್ ಇನ್ವಾಯ್ಸ್ ಪ್ರತಿ', isMandatory: true },
      { key: 'insurance', label: 'Valid Motor Insurance Certificate', labelKn: 'ಮಾನ್ಯತೆ ಪಡೆದ ವಿಮಾ ಪತ್ರ', isMandatory: true },
      { key: 'aadhaar', label: 'Owner Aadhaar & Address Proof', labelKn: 'ಮಾಲೀಕರ ಆಧಾರ್ ಮತ್ತು ವಿಳಾಸ ಪುರಾವೆ', isMandatory: true },
      { key: 'temp_registration', label: 'Temporary Registration (TR) Copy', labelKn: 'ತಾತ್ಕಾಲಿಕ ನೋಂದಣಿ (TR) ಪ್ರತಿ', isMandatory: false },
      { key: 'pan_or_form60', label: 'PAN Card or Form 60', labelKn: 'ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಅಥವಾ ಫಾರ್ಮ್ 60', isMandatory: true },
      { key: 'chassis_pencil_print', label: 'Chassis Pencil Print Trace', labelKn: 'ಚಾಸಿಸ್ ಪೆನ್ಸಿಲ್ ಪ್ರಿಂಟ್', isMandatory: true },
    ],
  },
  {
    type: 'ownership_transfer',
    label: 'Ownership Transfer (Transfer of Ownership - TO)',
    labelKn: 'ಮಾಲೀಕತ್ವ ವರ್ಗಾವಣೆ',
    description: 'Transfer vehicle ownership between parties in Karnataka',
    checklist: [
      { key: 'form_29', label: 'Form 29 (Notice of Transfer, in duplicate)', labelKn: 'ಫಾರ್ಮ್ 29 (ವರ್ಗಾವಣೆ ನೋಟಿಸ್ - 2 ಪ್ರತಿಗಳು)', isMandatory: true },
      { key: 'form_30', label: 'Form 30 (Application for Intimation of TO)', labelKn: 'ಫಾರ್ಮ್ 30 (ಮಾಲೀಕತ್ವ ಬದಲಾವಣೆ ಅರ್ಜಿ)', isMandatory: true },
      { key: 'original_rc', label: 'Original Registration Certificate (RC)', labelKn: 'ಮೂಲ ಆರ್‌ಸಿ ಪುಸ್ತಕ/ಕಾರ್ಡ್', isMandatory: true },
      { key: 'insurance', label: 'Valid Insurance in Buyer/Seller Name', labelKn: 'ಮಾನ್ಯ ವಿಮಾ ಪಾಲಿಸಿ', isMandatory: true },
      { key: 'puc', label: 'Valid PUC (Pollution Under Control)', labelKn: 'ಮಾನ್ಯ ವಾಯು ಮಾಲಿನ್ಯ ಪ್ರಮಾಣಪತ್ರ', isMandatory: true },
      { key: 'buyer_aadhaar', label: 'Buyer Aadhaar / Address Proof (Karnataka)', labelKn: 'ಖರೀದಿದಾರರ ಆಧಾರ್ / ವಿಳಾಸ ಪುರಾವೆ', isMandatory: true },
      { key: 'seller_id', label: 'Seller ID Proof & Signatures Verification', labelKn: 'ಮಾರಾಟಗಾರರ ಗುರುತಿನ ಚೀಟಿ', isMandatory: true },
      { key: 'clearance_certificate', label: 'RTO Tax Clearance / No Objection', labelKn: 'ತೆರಿಗೆ ಕ್ಲಿಯರೆನ್ಸ್ ಪ್ರಮಾಣಪತ್ರ', isMandatory: false },
    ],
  },
  {
    type: 'hypothecation_addition',
    label: 'Hypothecation Addition (HPA)',
    labelKn: 'ಹೈಪೋಥಿಕೇಶನ್ ಸೇರ್ಪಡೆ (HPA)',
    description: 'Add financier / bank loan lien endorsement to RC',
    checklist: [
      { key: 'form_34', label: 'Form 34 (Application for Making an Entry of Hire-Purchase)', labelKn: 'ಫಾರ್ಮ್ 34 (ಸಾಲ ನಮೂದು ಅರ್ಜಿ)', isMandatory: true },
      { key: 'original_rc', label: 'Original RC Card', labelKn: 'ಮೂಲ ಆರ್‌ಸಿ ಕಾರ್ಡ್', isMandatory: true },
      { key: 'insurance', label: 'Valid Insurance with Bank Endorsement', labelKn: 'ಬ್ಯಾಂಕ್ ಹೆಸರುಳ್ಳ ವಿಮೆ', isMandatory: true },
      { key: 'puc', label: 'Valid PUC Certificate', labelKn: 'ಮಾನ್ಯ ಪಿಯುಸಿ ಪ್ರಮಾಣಪತ್ರ', isMandatory: true },
      { key: 'financier_sanction_letter', label: 'Bank Sanction Letter / Loan Agreement', labelKn: 'ಬ್ಯಾಂಕ್ ಸಾಲ ಮಂಜೂರಾತಿ ಪತ್ರ', isMandatory: true },
    ],
  },
  {
    type: 'hypothecation_termination',
    label: 'Hypothecation Termination (HPT / NOC from Bank)',
    labelKn: 'ಹೈಪೋಥಿಕೇಶನ್ ರದ್ದತಿ (HPT / ಲೋನ್ ಕ್ಲಿಯರೆನ್ಸ್)',
    description: 'Remove financier lien upon loan closure',
    checklist: [
      { key: 'form_35', label: 'Form 35 (Duplicate signed by Financier)', labelKn: 'ಫಾರ್ಮ್ 35 (ಹಣಕಾಸು ಸಂಸ್ಥೆಯ ಸಹಿ)', isMandatory: true },
      { key: 'bank_noc', label: 'Bank NOC / Loan Closure Letter', labelKn: 'ಬ್ಯಾಂಕ್ ಎನ್‌ಒಸಿ ಪತ್ರ', isMandatory: true },
      { key: 'original_rc', label: 'Original RC Card', labelKn: 'ಮೂಲ ಆರ್‌ಸಿ ಕಾರ್ಡ್', isMandatory: true },
      { key: 'insurance', label: 'Valid Insurance Copy', labelKn: 'ಮಾನ್ಯ ವಿಮೆ ಪ್ರತಿ', isMandatory: true },
      { key: 'puc', label: 'Valid PUC Certificate', labelKn: 'ಪಿಯುಸಿ ಪ್ರಮಾಣಪತ್ರ', isMandatory: true },
    ],
  },
  {
    type: 'duplicate_rc',
    label: 'Duplicate RC (Lost / Damaged RC)',
    labelKn: 'ನಕಲಿ ಆರ್‌ಸಿ (ಕಳೆದುಹೋದ/ಹಾಳಾದ ಆರ್‌ಸಿ)',
    description: 'Issue of duplicate RC for lost or damaged card',
    checklist: [
      { key: 'form_26', label: 'Form 26 (Application for Duplicate RC)', labelKn: 'ಫಾರ್ಮ್ 26 (ನಕಲಿ ಆರ್‌ಸಿ ಅರ್ಜಿ)', isMandatory: true },
      { key: 'police_fir_lost_report', label: 'Police Complaint / E-Lost Report (Karnataka)', labelKn: 'ಪೊಲೀಸ್ ಇ-ಲಾಸ್ಟ್ ದೂರು ಪ್ರತಿ', isMandatory: true },
      { key: 'insurance', label: 'Valid Insurance Certificate', labelKn: 'ಮಾನ್ಯ ವಿಮೆ ಪ್ರಮಾಣಪತ್ರ', isMandatory: true },
      { key: 'puc', label: 'Valid PUC Certificate', labelKn: 'ಮಾನ್ಯ ಪಿಯುಸಿ', isMandatory: true },
      { key: 'owner_aadhaar', label: 'Owner Aadhaar & Affidavit', labelKn: 'ಮಾಲೀಕರ ಆಧಾರ್ ಮತ್ತು ಅಫಿಡವಿಟ್', isMandatory: true },
    ],
  },
  {
    type: 'rc_renewal',
    label: 'RC Renewal / Fitness Renewal (15+ Years)',
    labelKn: 'ಆರ್‌ಸಿ ನವೀಕರಣ / ಫಿಟ್‌ನೆಸ್ ನವೀಕರಣ',
    description: 'Renewal of registration certificate after 15 years',
    checklist: [
      { key: 'form_25', label: 'Form 25 (Application for Renewal of RC)', labelKn: 'ಫಾರ್ಮ್ 25 (ನವೀಕರಣ ಅರ್ಜಿ)', isMandatory: true },
      { key: 'original_rc', label: 'Original RC', labelKn: 'ಮೂಲ ಆರ್‌ಸಿ', isMandatory: true },
      { key: 'fitness_test_challan', label: 'Green Tax & Fitness Inspection Fee Challan', labelKn: 'ಗ್ರೀನ್ ಟ್ಯಾಕ್ಸ್ ಮತ್ತು ತಪಾಸಣೆ ಶುಲ್ಕ ರಶೀದಿ', isMandatory: true },
      { key: 'insurance', label: 'Valid Comprehensive / Third Party Insurance', labelKn: 'ಮಾನ್ಯ ವಿಮೆ ಪಾಲಿಸಿ', isMandatory: true },
      { key: 'puc', label: 'Valid Pollution Certificate (PUC)', labelKn: 'ಪಿಯುಸಿ ಪತ್ರ', isMandatory: true },
    ],
  },
  {
    type: 'noc_processing',
    label: 'No Objection Certificate (NOC for Interstate Transfer)',
    labelKn: 'ಎನ್‌ಒಸಿ (ಇತರ ರಾಜ್ಯಕ್ಕೆ ವರ್ಗಾವಣೆ)',
    description: 'NOC for moving vehicle to another state/RTO',
    checklist: [
      { key: 'form_28', label: 'Form 28 (Application for NOC in Triplicate)', labelKn: 'ಫಾರ್ಮ್ 28 (ಮೂರು ಪ್ರತಿಗಳಲ್ಲಿ)', isMandatory: true },
      { key: 'original_rc', label: 'Original Registration Certificate', labelKn: 'ಮೂಲ ಆರ್‌ಸಿ', isMandatory: true },
      { key: 'insurance', label: 'Valid Insurance Copy', labelKn: 'ಮಾನ್ಯ ವಿಮೆ', isMandatory: true },
      { key: 'puc', label: 'Valid PUC Certificate', labelKn: 'ಪಿಯುಸಿ', isMandatory: true },
      { key: 'ncrb_clearance', label: 'NCRB / Police Crime Clearance Record', labelKn: 'ಪೊಲೀಸ್ ನಿರಾಕ್ಷೇಪಣಾ ವರದಿ', isMandatory: true },
      { key: 'tax_clearance', label: 'Karnataka Road Tax Clearance', labelKn: 'ರಸ್ತೆ ತೆರಿಗೆ ಕ್ಲಿಯರೆನ್ಸ್', isMandatory: true },
    ],
  },
  {
    type: 'address_change',
    label: 'Change of Address in RC',
    labelKn: 'ವಿಳಾಸ ಬದಲಾವಣೆ',
    description: 'Update residential address in vehicle RC record',
    checklist: [
      { key: 'form_33', label: 'Form 33 (Application for Change of Address)', labelKn: 'ಫಾರ್ಮ್ 33 (ವಿಳಾಸ ಬದಲಾವಣೆ ಅರ್ಜಿ)', isMandatory: true },
      { key: 'original_rc', label: 'Original RC Card', labelKn: 'ಮೂಲ ಆರ್‌ಸಿ', isMandatory: true },
      { key: 'new_address_proof', label: 'New Address Proof (Aadhaar / Passport / Rent Agrmt)', labelKn: 'ಹೊಸ ವಿಳಾಸ ಪುರಾವೆ (ಆಧಾರ್)', isMandatory: true },
      { key: 'insurance', label: 'Valid Insurance Certificate', labelKn: 'ಮಾನ್ಯ ವಿಮೆ', isMandatory: true },
      { key: 'puc', label: 'Valid PUC', labelKn: 'ಪಿಯುಸಿ', isMandatory: true },
    ],
  },
  {
    type: 'insurance_update',
    label: 'Insurance Endorsement & Update',
    labelKn: 'ವಿಮೆ ಅಪ್‌ಡೇಟ್',
    description: 'Update renewed insurance on Vahan record',
    checklist: [
      { key: 'insurance_policy', label: 'New Insurance Policy Schedule', labelKn: 'ಹೊಸ ವಿಮಾ ಪಾಲಿಸಿ ಪ್ರತಿ', isMandatory: true },
      { key: 'rc_copy', label: 'Registration Certificate Copy', labelKn: 'ಆರ್‌ಸಿ ಪ್ರತಿ', isMandatory: true },
    ],
  },
  {
    type: 'other',
    label: 'Other RTO Work / Miscellaneous',
    labelKn: 'ಇತರೆ ಆರ್‌ಟಿಒ ಸೇವೆಗಳು',
    description: 'Custom paperwork or clearance',
    checklist: [
      { key: 'application_form', label: 'General Application Letter / Form', labelKn: 'ಅರ್ಜಿ ಪತ್ರ', isMandatory: true },
      { key: 'id_proof', label: 'Applicant ID Proof', labelKn: 'ಗುರುತಿನ ಚೀಟಿ', isMandatory: true },
      { key: 'supporting_docs', label: 'Supporting RTO Documents', labelKn: 'ದಾಖಲೆಗಳು', isMandatory: false },
    ],
  },
];

export function getServiceChecklist(serviceType: string): ChecklistTemplateItem[] {
  const found = RTO_SERVICES.find((s) => s.type === serviceType);
  return found ? found.checklist : RTO_SERVICES[RTO_SERVICES.length - 1].checklist;
}
