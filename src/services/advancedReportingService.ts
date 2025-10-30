import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'administrative' | 'analytics' | 'custom';
  sections: ReportSection[];
  styling: ReportStyling;
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'chart' | 'table' | 'image' | 'summary';
  content: any;
  order: number;
}

export interface ReportStyling {
  headerColor: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
  logo?: string;
  footerText?: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  templateId: string;
  facultyId: string;
  courseId?: string;
  data: any;
  generatedAt: Timestamp;
  status: 'generating' | 'completed' | 'failed';
  downloadUrl?: string;
  fileSize?: string;
  pages?: number;
}

class AdvancedReportingService {
  // Report Templates Management
  async getReportTemplates(facultyId: string): Promise<ReportTemplate[]> {
    try {
      const templatesQuery = query(
        collection(db, 'reportTemplates'),
        where('facultyId', '==', facultyId)
      );
      const snapshot = await getDocs(templatesQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReportTemplate[];
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }

  async getDefaultTemplates(): Promise<ReportTemplate[]> {
    try {
      const defaultTemplates = [
        {
          id: 'academic-overview',
          name: 'Academic Overview Report',
          description: 'Comprehensive academic performance overview',
          category: 'academic',
          sections: [
            {
              id: 'header',
              title: 'Course Overview',
              type: 'summary',
              content: { includeCourseInfo: true, includeInstructorInfo: true },
              order: 1
            },
            {
              id: 'grades',
              title: 'Grade Distribution',
              type: 'chart',
              content: { chartType: 'pie', includeStatistics: true },
              order: 2
            },
            {
              id: 'assignments',
              title: 'Assignment Performance',
              type: 'table',
              content: { includeSubmissionRates: true, includeAverageGrades: true },
              order: 3
            },
            {
              id: 'students',
              title: 'Student Performance Summary',
              type: 'table',
              content: { includeTopPerformers: true, includeAtRiskStudents: true },
              order: 4
            }
          ],
          styling: {
            headerColor: '#4f46e5',
            primaryColor: '#1f2937',
            secondaryColor: '#6b7280',
            fontFamily: 'Arial',
            fontSize: 12
          },
          isDefault: true,
          createdAt: Timestamp.now()
        },
        {
          id: 'assignment-analysis',
          name: 'Assignment Analysis Report',
          description: 'Detailed analysis of assignment performance',
          category: 'analytics',
          sections: [
            {
              id: 'summary',
              title: 'Assignment Summary',
              type: 'summary',
              content: { includeTotalAssignments: true, includeAverageGrade: true },
              order: 1
            },
            {
              id: 'trends',
              title: 'Performance Trends',
              type: 'chart',
              content: { chartType: 'line', timeRange: 'semester' },
              order: 2
            },
            {
              id: 'detailed',
              title: 'Detailed Assignment Breakdown',
              type: 'table',
              content: { includeAllAssignments: true, includeSubmissionStats: true },
              order: 3
            }
          ],
          styling: {
            headerColor: '#059669',
            primaryColor: '#1f2937',
            secondaryColor: '#6b7280',
            fontFamily: 'Arial',
            fontSize: 12
          },
          isDefault: true,
          createdAt: Timestamp.now()
        },
        {
          id: 'student-progress',
          name: 'Student Progress Report',
          description: 'Individual student progress tracking',
          category: 'academic',
          sections: [
            {
              id: 'student-info',
              title: 'Student Information',
              type: 'summary',
              content: { includePersonalInfo: true, includeContactInfo: true },
              order: 1
            },
            {
              id: 'grade-progress',
              title: 'Grade Progress Over Time',
              type: 'chart',
              content: { chartType: 'line', includeTrends: true },
              order: 2
            },
            {
              id: 'assignments',
              title: 'Assignment History',
              type: 'table',
              content: { includeAllAssignments: true, includeGrades: true },
              order: 3
            },
            {
              id: 'recommendations',
              title: 'Recommendations',
              type: 'text',
              content: { includeSuggestions: true, includeActionItems: true },
              order: 4
            }
          ],
          styling: {
            headerColor: '#dc2626',
            primaryColor: '#1f2937',
            secondaryColor: '#6b7280',
            fontFamily: 'Arial',
            fontSize: 12
          },
          isDefault: true,
          createdAt: Timestamp.now()
        }
      ];
      
      return defaultTemplates;
    } catch (error) {
      console.error('Error fetching default templates:', error);
      throw error;
    }
  }

  // Report Generation
  async generateReport(
    templateId: string,
    facultyId: string,
    courseId: string,
    reportData: any
  ): Promise<GeneratedReport> {
    try {
      // Create report record
      const reportRef = doc(collection(db, 'generatedReports'));
      const report: GeneratedReport = {
        id: reportRef.id,
        title: reportData.title,
        templateId,
        facultyId,
        courseId,
        data: reportData,
        generatedAt: Timestamp.now(),
        status: 'generating'
      };

      // Start PDF generation process
      this.generatePDF(report, reportData)
        .then(pdfData => {
          // Update report with generated PDF data
          report.status = 'completed';
          report.downloadUrl = pdfData.url;
          report.fileSize = pdfData.size;
          report.pages = pdfData.pages;
        })
        .catch(error => {
          console.error('PDF generation failed:', error);
          report.status = 'failed';
        });

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private async generatePDF(report: GeneratedReport, data: any): Promise<any> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(79, 70, 229); // Primary color
      pdf.text(report.title, 20, 30);
      
      // Add course information
      if (data.courseInfo) {
        pdf.setFontSize(12);
        pdf.setTextColor(31, 41, 55); // Dark gray
        pdf.text(`Course: ${data.courseInfo.name}`, 20, 45);
        pdf.text(`Instructor: ${data.courseInfo.instructor}`, 20, 52);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 59);
      }

      let yPosition = 80;

      // Add sections based on template
      for (const section of data.sections || []) {
        // Add section title
        pdf.setFontSize(14);
        pdf.setTextColor(79, 70, 229);
        pdf.text(section.title, 20, yPosition);
        yPosition += 10;

        // Add section content based on type
        switch (section.type) {
          case 'summary':
            yPosition = this.addSummarySection(pdf, section.content, yPosition);
            break;
          case 'chart':
            yPosition = await this.addChartSection(pdf, section.content, yPosition);
            break;
          case 'table':
            yPosition = this.addTableSection(pdf, section.content, yPosition);
            break;
          case 'text':
            yPosition = this.addTextSection(pdf, section.content, yPosition);
            break;
        }

        yPosition += 20; // Space between sections

        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 30;
        }
      }

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // Light gray
      pdf.text('Generated by Learnova CMS', 20, pageHeight - 20);
      pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - 30, pageHeight - 20);

      // Generate blob URL
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      return {
        url,
        size: `${(pdfBlob.size / 1024).toFixed(1)} KB`,
        pages: pdf.getNumberOfPages()
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }

  private addSummarySection(pdf: jsPDF, content: any, yPosition: number): number {
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    
    if (content.includeCourseInfo) {
      pdf.text('• Course Information: Complete', 30, yPosition);
      yPosition += 7;
    }
    if (content.includeInstructorInfo) {
      pdf.text('• Instructor Details: Available', 30, yPosition);
      yPosition += 7;
    }
    if (content.includeTotalAssignments) {
      pdf.text('• Total Assignments: 12', 30, yPosition);
      yPosition += 7;
    }
    if (content.includeAverageGrade) {
      pdf.text('• Average Grade: 85.2%', 30, yPosition);
      yPosition += 7;
    }
    
    return yPosition;
  }

  private async addChartSection(pdf: jsPDF, content: any, yPosition: number): Promise<number> {
    // Create a simple chart representation
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`Chart: ${content.chartType.toUpperCase()}`, 30, yPosition);
    yPosition += 10;
    
    // Add chart placeholder
    pdf.rect(30, yPosition, 150, 60);
    pdf.setFontSize(8);
    pdf.text('[Chart would be rendered here]', 35, yPosition + 35);
    
    return yPosition + 70;
  }

  private addTableSection(pdf: jsPDF, content: any, yPosition: number): number {
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    
    // Add table headers
    const headers = ['Item', 'Value', 'Status'];
    const startX = 30;
    const colWidth = 50;
    
    pdf.setFontSize(8);
    pdf.setTextColor(79, 70, 229);
    headers.forEach((header, index) => {
      pdf.text(header, startX + (index * colWidth), yPosition);
    });
    
    yPosition += 7;
    
    // Add sample table data
    const sampleData = [
      ['Assignment 1', '92%', 'Completed'],
      ['Assignment 2', '88%', 'Completed'],
      ['Assignment 3', '85%', 'Completed']
    ];
    
    pdf.setTextColor(31, 41, 55);
    sampleData.forEach(row => {
      row.forEach((cell, index) => {
        pdf.text(cell, startX + (index * colWidth), yPosition);
      });
      yPosition += 6;
    });
    
    return yPosition + 10;
  }

  private addTextSection(pdf: jsPDF, content: any, yPosition: number): number {
    pdf.setFontSize(10);
    pdf.setTextColor(31, 41, 55);
    
    if (content.includeSuggestions) {
      pdf.text('Recommendations:', 30, yPosition);
      yPosition += 7;
      pdf.text('• Focus on improving assignment completion rates', 35, yPosition);
      yPosition += 6;
      pdf.text('• Consider additional support for struggling students', 35, yPosition);
      yPosition += 6;
    }
    
    return yPosition;
  }

  // Get generated reports
  async getGeneratedReports(facultyId: string): Promise<GeneratedReport[]> {
    try {
      const reportsQuery = query(
        collection(db, 'generatedReports'),
        where('facultyId', '==', facultyId),
        orderBy('generatedAt', 'desc')
      );
      const snapshot = await getDocs(reportsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GeneratedReport[];
    } catch (error) {
      console.error('Error fetching generated reports:', error);
      throw error;
    }
  }

  // Delete report
  async deleteReport(reportId: string): Promise<void> {
    try {
      const reportRef = doc(db, 'generatedReports', reportId);
      await reportRef.delete();
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }
}

export const advancedReportingService = new AdvancedReportingService();
