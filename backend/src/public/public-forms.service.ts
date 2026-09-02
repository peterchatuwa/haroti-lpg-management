import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications/notifications.service';
import { CareersFormDto } from './dto/careers-form.dto';
import { ContactFormDto } from './dto/contact-form.dto';
import { FranchiseFormDto } from './dto/franchise-form.dto';

@Injectable()
export class PublicFormsService {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  private operationsEmail() {
    return this.config.get<string>(
      'WEBSITE_OPERATIONS_EMAIL',
      'operations@harotiholdingslimited.com',
    );
  }

  private rejectHoneypot(value?: string) {
    if (value?.trim()) {
      throw new BadRequestException('Invalid submission');
    }
  }

  async submitContact(dto: ContactFormDto) {
    this.rejectHoneypot(dto.website);
    const subject = `[Website Contact] ${dto.subject}`;
    const body = [
      `New contact form submission`,
      '',
      `Name: ${dto.firstName} ${dto.lastName}`,
      `Email: ${dto.email}`,
      `Phone: ${dto.phone || 'Not provided'}`,
      `Subject: ${dto.subject}`,
      '',
      'Message:',
      dto.message,
    ].join('\n');

    const result = await this.notifications.sendDirectEmail(
      this.operationsEmail(),
      subject,
      body,
      dto.email,
    );
    if (!result.ok) {
      throw new ServiceUnavailableException(
        result.error ?? 'Unable to send message',
      );
    }
    return { ok: true };
  }

  async submitFranchise(dto: FranchiseFormDto) {
    this.rejectHoneypot(dto.website);
    const subject = `[Franchise Application] ${dto.firstName} ${dto.lastName}`;
    const body = [
      'New franchise application',
      '',
      `Name: ${dto.firstName} ${dto.lastName}`,
      `Email: ${dto.email}`,
      `Phone: ${dto.phone}`,
      `National ID: ${dto.nationalId}`,
      `Date of birth: ${dto.dateOfBirth}`,
      '',
      `District: ${dto.district}`,
      `Town/Area: ${dto.town}`,
      `Location details: ${dto.locationDetails}`,
      '',
      `Business experience: ${dto.hasExperience}`,
      `Capital range: ${dto.capitalRange}`,
      `Women/youth programme: ${dto.specialProgramme}`,
      '',
      'Motivation:',
      dto.motivation,
      '',
      dto.additionalInfo
        ? `Additional information:\n${dto.additionalInfo}`
        : 'Additional information: None',
    ].join('\n');

    const result = await this.notifications.sendDirectEmail(
      this.operationsEmail(),
      subject,
      body,
      dto.email,
    );
    if (!result.ok) {
      throw new ServiceUnavailableException(
        result.error ?? 'Unable to send application',
      );
    }
    return { ok: true };
  }

  async submitCareers(dto: CareersFormDto) {
    this.rejectHoneypot(dto.website);
    const subject = `[Careers Application] ${dto.position} — ${dto.firstName} ${dto.lastName}`;
    const body = [
      'New careers application',
      '',
      `Name: ${dto.firstName} ${dto.lastName}`,
      `Email: ${dto.email}`,
      `Phone: ${dto.phone}`,
      `Position: ${dto.position}`,
      '',
      'Cover letter:',
      dto.coverLetter,
      '',
      'Note: CV upload via website is not yet attached — follow up with the applicant if needed.',
    ].join('\n');

    const result = await this.notifications.sendDirectEmail(
      this.operationsEmail(),
      subject,
      body,
      dto.email,
    );
    if (!result.ok) {
      throw new ServiceUnavailableException(
        result.error ?? 'Unable to send application',
      );
    }
    return { ok: true };
  }
}
