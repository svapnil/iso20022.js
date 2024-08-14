import { CashManagementEndOfDayReport } from '../../../src/camt/053/CashManagementEndOfDayReport';
import fs from 'fs';
import { Party } from '../../../src/lib/types';

describe('CashManagementEndOfDayReport', () => {
    describe('fromXML', () => {
        it('should create an instance with valid config', () => {
            const camt053V2Sample = fs.readFileSync(`${process.cwd()}/test/assets/gs_camt_053_us_v2_sample.xml`, 'utf8');
            const report = CashManagementEndOfDayReport.fromXML(camt053V2Sample);

            expect(report.messageId).toBe('235549650');
            expect(report.creationDate).toBeInstanceOf(Date);
            expect(report.recipient).toEqual({
                id: 'test001',
                name: 'Test Client Ltd.',
            });
            expect(report).toBeInstanceOf(CashManagementEndOfDayReport);

            // Statement is correct
            const statement = report.statements[0];
            expect(statement.id).toBe('258158850');
            expect(statement.creationDate).toBeInstanceOf(Date);
            expect(statement.electronicSequenceNumber).toBe(1);
            expect(statement.legalSequenceNumber).toBe(1);
            expect(statement.fromDate).toBeInstanceOf(Date);
            expect(statement.toDate).toBeInstanceOf(Date);
            expect(statement.numOfEntries).toBe(14);
            expect(statement.sumOfEntries).toBe(140);
            expect(statement.netAmountOfEntries).toBe(40);
            expect(statement.account).toEqual({
                accountNumber: 'DD01100056869',
                currency: 'USD',
                name: 'Sample Name 123',
            });
            expect(statement.agent).toEqual({
                bic: 'GSCRUS30'
            });
        });
    });
});
