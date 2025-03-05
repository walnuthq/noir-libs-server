import { NameValidatorService } from './name-validator.service';
import { BadRequestException } from '@nestjs/common';

describe('NameValidatorService', () => {
    let service: NameValidatorService;

    beforeEach(() => {
        service = new NameValidatorService();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    async function runValidationTest(name: string, expectedMessage: string) {
        await expect(service.validateName(name))
            .rejects
            .toThrow(new BadRequestException(expectedMessage));
    }

    async function runValidNameTest(name: string) {
        await expect(service.validateName(name)).resolves.toBeUndefined();
    }

    it('should throw an error if name is empty', async () => {
        await runValidationTest('', "Package name cannot be empty");
    });

    it('should throw an error if name contains spaces', async () => {
        await runValidationTest('invalid name', "Package name cannot contain white spaces");
    });

    it('should throw an error if name contains tabs or newlines', async () => {
        await runValidationTest('invalid\tname', "Package name cannot contain white spaces");
        await runValidationTest('invalid\nname', "Package name cannot contain white spaces");
    });

    it('should throw an error if name is longer than 64 characters', async () => {
        const longName = 'a'.repeat(65);
        await runValidationTest(longName, "Package name cannot be longer than 64 characters");
    });

    it('should throw an error if name contains invalid characters', async () => {
        await runValidationTest('invalid$name', "Package name can only contain small letter alphanumeric characters and/or underscores");
    });

    it('should throw an error if name starts with a non-alphanumeric character', async () => {
        await runValidationTest('-invalidname', "Package name can only contain small letter alphanumeric characters and/or underscores");
    });

    it('should throw an error if name ends with a non-alphanumeric character', async () => {
        await runValidationTest('invalidname-', "Package name can only contain small letter alphanumeric characters and/or underscores");
    });

    it('should throw an error if name contains double dashes', async () => {
        await runValidationTest('invalid--name', "Package name can only contain small letter alphanumeric characters and/or underscores");
    });

    it('should throw an error if name contains double underscores', async () => {
        await runValidationTest('invalid__name', "Package name cannot contain double dashes or underscores");
    });

    it('should throw an error if name is a reserved name', async () => {
        await runValidationTest('con', "Package name cannot used the reserved name con");
    });

    it('should throw an error if name is a reserved name but with different casing', async () => {
        await runValidationTest('com1', "Package name cannot used the reserved name com1");
    });

    it('should throw an error if name contains dash', async () => {
        await runValidationTest('valid-name', "Package name can only contain small letter alphanumeric characters and/or underscores");
    });

    it('should not throw error for valid name', async () => {
        await runValidNameTest('valid_name');
        await runValidNameTest('validname');
        await runValidNameTest('validname123');
        await runValidNameTest('123validname');
        await runValidNameTest('123_valid_name');
    });
});
