from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from typing import Dict, Any, List
import io
from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Session as SessionModel, Turn, Candidate, Job, ProctorEvent
from .proctor_signals import proctor_signals


class ReportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
        )
    
    def _get_category_color(self, category: str) -> str:
        """Get color code for score category"""
        color_map = {
            "Best Fit": "green",
            "Good Fit": "darkgreen",
            "Average": "orange",
            "Needs Improvement": "darkorange",
            "Not Recommended": "red"
        }
        return color_map.get(category, "black")
    
    def generate_session_report(self, session_id: int, db: Session) -> bytes:
        """Generate comprehensive PDF report for interview session"""
        
        # Get session data
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        # Get related data
        candidate = db.query(Candidate).filter(Candidate.id == session.invite.candidate_id).first()
        job = db.query(Job).filter(Job.id == session.invite.job_id).first()
        turns = db.query(Turn).filter(Turn.session_id == session_id).order_by(Turn.idx).all()
        
        # Get risk assessment
        risk_assessment = proctor_signals.get_risk_assessment(session_id, db)
        
        # Create PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Title
        title = f"Interview Report - {candidate.name if candidate else 'Unknown'}"
        story.append(Paragraph(title, self.title_style))
        story.append(Spacer(1, 12))
        
        # Session Information
        story.append(Paragraph("Session Information", self.heading_style))
        
        # Get final assessment from metadata if available
        final_assessment = None
        if session.session_metadata and 'final_assessment' in session.session_metadata:
            final_assessment = session.session_metadata['final_assessment']
        
        session_info = [
            ['Session ID:', str(session.id)],
            ['Candidate:', candidate.name if candidate else 'Unknown'],
            ['Email:', candidate.email if candidate else 'Unknown'],
            ['Position:', job.title if job else 'Unknown'],
            ['Department:', job.department if job else 'Unknown'],
            ['Started:', session.started_at.strftime('%Y-%m-%d %H:%M:%S UTC') if session.started_at else 'Not Started'],
            ['Ended:', session.ended_at.strftime('%Y-%m-%d %H:%M:%S UTC') if session.ended_at else 'In Progress'],
            ['Status:', session.status],
            ['Overall Score:', f"{session.score:.1f}/10" if session.score else 'N/A'],
            ['Score Category:', session.score_category if session.score_category else 'N/A']
        ]
        
        session_table = Table(session_info, colWidths=[2*inch, 4*inch])
        session_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(session_table)
        story.append(Spacer(1, 20))
        
        # Interview Questions & Responses
        story.append(Paragraph("Interview Transcript", self.heading_style))
        
        if turns:
            for turn in turns:
                # Question
                story.append(Paragraph(f"<b>Question {turn.idx}:</b>", self.styles['Normal']))
                story.append(Paragraph(turn.prompt, self.styles['Normal']))
                story.append(Spacer(1, 6))
                
                # Answer
                story.append(Paragraph("<b>Candidate Response:</b>", self.styles['Normal']))
                answer_text = turn.answer_text if turn.answer_text else "[No response recorded]"
                story.append(Paragraph(answer_text, self.styles['Normal']))
                story.append(Spacer(1, 6))
                
                # Timing and Score
                timing_info = []
                if turn.scores_json and 'score' in turn.scores_json:
                    timing_info.append(f"Score: {turn.scores_json['score']}/10")
                if turn.status:
                    timing_info.append(f"Status: {turn.status}")
                if turn.submitted_at:
                    duration = (turn.submitted_at - turn.start_time).total_seconds()
                    timing_info.append(f"Duration: {duration:.1f}s")
                
                if timing_info:
                    story.append(Paragraph(f"<i>{' | '.join(timing_info)}</i>", self.styles['Normal']))
                
                # Missing points
                if turn.scores_json and 'missing' in turn.scores_json and turn.scores_json['missing']:
                    missing_points = ', '.join(turn.scores_json['missing'][:3])  # Limit to 3
                    story.append(Paragraph(f"<i>Areas for improvement: {missing_points}</i>", self.styles['Normal']))
                
                story.append(Spacer(1, 15))
        else:
            story.append(Paragraph("No questions were answered in this session.", self.styles['Normal']))
            story.append(Spacer(1, 20))
        
        # Proctoring Summary
        story.append(Paragraph("Proctoring Summary", self.heading_style))
        
        proctor_data = [
            ['Risk Score:', f"{risk_assessment['risk_score']:.1f}/100"],
            ['Risk Level:', risk_assessment['risk_level']],
            ['Total Events:', str(risk_assessment['total_events'])]
        ]
        
        # Add event breakdown
        for event_type, count in risk_assessment['event_summary'].items():
            proctor_data.append([f"{event_type.replace('_', ' ').title()}:", str(count)])
        
        proctor_table = Table(proctor_data, colWidths=[2*inch, 1.5*inch])
        proctor_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(proctor_table)
        story.append(Spacer(1, 12))
        
        # Flags
        if risk_assessment['flags']:
            story.append(Paragraph("<b>Integrity Flags:</b>", self.styles['Normal']))
            for flag in risk_assessment['flags']:
                story.append(Paragraph(f"• {flag}", self.styles['Normal']))
        else:
            story.append(Paragraph("<b>No integrity issues detected.</b>", self.styles['Normal']))
        
        story.append(Spacer(1, 20))
        
        # Final Assessment Section
        if final_assessment:
            from ..services.scoring import get_score_breakdown_text
            
            story.append(Paragraph("Final Assessment & Recommendation", self.heading_style))
            story.append(Spacer(1, 6))
            
            # Score Category (Highlighted)
            category = final_assessment['score_category']
            category_color = self._get_category_color(category)
            
            story.append(Paragraph(
                f"<b>Overall Rating: </b><font color='{category_color}'><b>{category.upper()}</b></font>",
                self.heading_style
            ))
            story.append(Spacer(1, 8))
            
            # Detailed Metrics
            assessment_data = [
                ['Raw Average Score:', f"{final_assessment['raw_score']:.1f}/10"],
                ['Adjusted Score:', f"{final_assessment['adjusted_score']:.1f}/10"],
                ['Completion Rate:', f"{final_assessment['completion_rate']}%"],
                ['Successful Questions:', str(final_assessment['successful_questions'])],
                ['Failed Attempts:', str(final_assessment['failed_attempts'])],
                ['Integrity Risk:', f"{final_assessment['proctor_risk']:.1f}/100"]
            ]
            
            assessment_table = Table(assessment_data, colWidths=[2.5*inch, 2*inch])
            assessment_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
            ]))
            story.append(assessment_table)
            story.append(Spacer(1, 12))
            
            # Assessment Summary
            story.append(Paragraph("<b>Summary:</b>", self.styles['Normal']))
            story.append(Paragraph(final_assessment['assessment_summary'], self.styles['Normal']))
            story.append(Spacer(1, 10))
            
            # Recommendation
            story.append(Paragraph("<b>Hiring Recommendation:</b>", self.styles['Normal']))
            story.append(Paragraph(final_assessment['recommendation'], self.styles['Normal']))
            story.append(Spacer(1, 10))
            
            # Category Breakdown
            story.append(Paragraph("<b>Rating Explanation:</b>", self.styles['Normal']))
            breakdown_text = get_score_breakdown_text(category)
            story.append(Paragraph(breakdown_text, self.styles['Normal']))
            story.append(Spacer(1, 20))
        
        # Footer
        story.append(Paragraph("Report generated on " + datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'), 
                              self.styles['Normal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()


# Global instance
report_service = ReportService()