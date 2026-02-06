import { Readable } from 'stream';

const csvParser = require('csv-parser');

export interface CsvRow {
    phoneNumber?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: any;
}

export interface CsvValidationResult {
    valid: boolean;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicates: number;
    errors: string[];
    warnings: string[];
}

export interface Recipient {
    phoneNumber?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}

const MAX_ROWS = 10000;

/**
 * Parse CSV file buffer
 */
export async function parseCsv(fileBuffer: Buffer): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
        const results: CsvRow[] = [];
        const stream = Readable.from(fileBuffer);

        stream
            .pipe(csvParser())
            .on('data', (data: CsvRow) => {
                results.push(data);

                // Stop if exceeding max rows
                if (results.length > MAX_ROWS) {
                    stream.destroy();
                }
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (error: any) => {
                reject(error);
            });
    });
}

/**
 * Validate CSV format and content
 */
export function validateCsvFormat(rows: CsvRow[]): CsvValidationResult {
    const result: CsvValidationResult = {
        valid: true,
        totalRows: rows.length,
        validRows: 0,
        invalidRows: 0,
        duplicates: 0,
        errors: [],
        warnings: [],
    };

    // Check max rows
    if (rows.length > MAX_ROWS) {
        result.valid = false;
        result.errors.push(`CSV file exceeds maximum ${MAX_ROWS} rows`);
        return result;
    }

    // Check headers
    if (rows.length === 0) {
        result.valid = false;
        result.errors.push('CSV file is empty');
        return result;
    }

    const firstRow = rows[0];
    const hasPhoneNumber = 'phoneNumber' in firstRow;
    const hasEmail = 'email' in firstRow;

    if (!hasPhoneNumber && !hasEmail) {
        result.valid = false;
        result.errors.push('CSV must contain at least phoneNumber or email column');
        return result;
    }

    // Track seen values for duplicate detection
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let isValid = true;

        // Validate phone number if present
        if (row.phoneNumber) {
            const phone = row.phoneNumber.trim();

            if (!isValidPhoneNumber(phone)) {
                result.warnings.push(`Row ${i + 1}: Invalid phone number format: ${phone}`);
                isValid = false;
            } else if (seenPhones.has(phone)) {
                result.duplicates++;
            } else {
                seenPhones.add(phone);
            }
        }

        // Validate email if present
        if (row.email) {
            const email = row.email.trim().toLowerCase();

            if (!isValidEmail(email)) {
                result.warnings.push(`Row ${i + 1}: Invalid email format: ${email}`);
                isValid = false;
            } else if (seenEmails.has(email)) {
                result.duplicates++;
            } else {
                seenEmails.add(email);
            }
        }

        // Must have at least phone or email
        if (!row.phoneNumber && !row.email) {
            result.warnings.push(`Row ${i + 1}: Missing both phoneNumber and email`);
            isValid = false;
        }

        if (isValid) {
            result.validRows++;
        } else {
            result.invalidRows++;
        }
    }

    if (result.duplicates > 0) {
        result.warnings.push(`Found ${result.duplicates} duplicate entries`);
    }

    return result;
}

/**
 * Extract unique recipients from CSV rows
 */
export function extractUniqueRecipients(rows: CsvRow[]): Recipient[] {
    const seen = new Set<string>();
    const recipients: Recipient[] = [];

    for (const row of rows) {
        const phone = row.phoneNumber?.trim();
        const email = row.email?.trim().toLowerCase();

        // Skip if no contact info
        if (!phone && !email) continue;

        // Create unique key
        const key = `${phone || ''}_${email || ''}`;

        // Skip duplicates
        if (seen.has(key)) continue;
        seen.add(key);

        // Validate
        const isValidPhone = phone && isValidPhoneNumber(phone);
        const isValidEmailAddr = email && isValidEmail(email);

        if (!isValidPhone && !isValidEmailAddr) continue;

        recipients.push({
            phoneNumber: isValidPhone ? phone : undefined,
            email: isValidEmailAddr ? email : undefined,
            firstName: row.firstName?.trim() || undefined,
            lastName: row.lastName?.trim() || undefined,
        });
    }

    return recipients;
}

/**
 * Validate phone number format (international)
 */
function isValidPhoneNumber(phone: string): boolean {
    // Remove all spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Should start with + and have 10-15 digits
    const regex = /^\+[1-9]\d{9,14}$/;
    return regex.test(cleaned);
}

/**
 * Validate email format (RFC 5322 simplified)
 */
function isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
