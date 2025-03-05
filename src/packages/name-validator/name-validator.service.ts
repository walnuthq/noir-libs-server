import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class NameValidatorService {

    private static readonly RESERVED_NAMES = [
        "nul", "con", "prn", "aux", "clock$", "com1", "com2", "com3", "com4",
        "com5", "com6", "com7", "com8", "com9", "lpt1", "lpt2", "lpt3", "lpt4",
        "lpt5", "lpt6", "lpt7", "lpt8", "lpt9"
    ];

    public async validateName(name: string): Promise<void> {
        if (!name) {
            throw new BadRequestException("Package name cannot be empty");
        }
        if (/\s/.test(name)) {
            throw new BadRequestException("Package name cannot contain white spaces");
        }
        if (name.length > 64) {
            throw new BadRequestException("Package name cannot be longer than 64 characters");
        }
        if (!/^[a-z0-9][a-z0-9_]*[a-z0-9]$/.test(name)) {
            throw new BadRequestException("Package name can only contain small letter alphanumeric characters and/or underscores");
        }
        if (/--|__/.test(name)) {
            throw new BadRequestException("Package name cannot contain double dashes or underscores");
        }
        if (NameValidatorService.RESERVED_NAMES.includes(name.toLowerCase())) {
            throw new BadRequestException(`Package name cannot used the reserved name ${name}`);
        }
    }
}