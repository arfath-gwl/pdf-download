import { HostListener, Inject, Input, Injectable } from '@angular/core';
import { CertificateDirectivesUtility } from './certificate-directives-utility';
import { CertificateDirectivesModule } from './certificate-directives.module';

@Injectable({ providedIn: CertificateDirectivesModule })
export class CertificateDownloadAsPdfService {

  constructor(
    @Inject('CANVG') private canvgModule,
    @Inject('JSPDF') private jsPDFModule,
  ) { }

  async download(template: string, handlePdfData?: (fileName: string, pdfData: Blob) => void) {
    if (template.startsWith('data:image/svg+xml,')) {
      template = decodeURIComponent(template.replace(/data:image\/svg\+xml,/, '')).replace(/\<!--\s*[a-zA-Z0-9\-]*\s*--\>/g, '');
    }
    const canvasElement = CertificateDirectivesUtility.appendGhostCanvas(
      'sbCertificateDownloadAsPdfCanvas' + Date.now(),
      {
        width: 1060,
        height: 750
      }
    );
    const context: CanvasRenderingContext2D = canvasElement.getContext('2d');
    const Canvg = await this.canvgModule;
    const canvg = await Canvg.from(context, template);

    const filename = CertificateDirectivesUtility.extractFileName(template);

    canvg.start();
    await canvg.ready();

    const imgData = canvasElement.toDataURL('image/png');
    const JsPDF = await this.jsPDFModule;
    const pdf = new JsPDF({ orientation: 'landscape' });
    pdf.addImage(imgData, 'PNG', 10, 10);

    if (handlePdfData) {
      handlePdfData(filename + '.pdf', pdf.output('blob'));
    } else {
      pdf.save(filename + '.pdf');
    }

    canvasElement.remove();
  }
}
