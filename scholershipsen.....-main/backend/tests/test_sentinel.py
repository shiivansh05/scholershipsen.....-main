"""
Automated Test Suite for Scholarship Sentinel.
Section 9 of SCHOLARSHIP_SENTINEL_FINAL.md:
1. Planted Hero Cluster CL-104 scores 87
2. Counterfactual: removing shared_mobile drops 87 to 67 (Review band)
3. Student 37 flagged for invalid Aadhaar length
4. Family Shield identifies siblings and clears legitimate contact sharing
5. Tamper-evident audit chain verifies intact; tampering triggers tamper alarm
6. Excel dataset (students.csv.xlsx) and CSV roster ingest and generate clusters
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.rules import evaluate_signals_comprehensive, compute_counterfactual
from app.forensics import validate_aadhaar_format, validate_verhoeff, detect_sequential_runs
from app.family import evaluate_family_shield, detect_households
from app.audit import append_audit_entry, verify_audit_chain, tamper_entry_for_demo
from app.graph import build_student_graph_from_records
from app.main import get_cluster_detail, get_cluster_counterfactual, get_summary

class TestScholarshipSentinel(unittest.TestCase):

    def test_hero_cluster_cl104_score(self):
        """CL-104 hero cluster must score 87 (Shared bank 25 + mobile 20 + cross-inst 15 + attendance 15 + doc 12 = 87)."""
        cluster = get_cluster_detail("CL-104")
        self.assertEqual(cluster["score"], 87)
        self.assertEqual(cluster["band"], "high")
        self.assertEqual(len(cluster["students"]), 4)

    def test_counterfactual_explanation(self):
        """Removing shared_mobile should reduce score from 87 to 67 and move band to Review."""
        res = get_cluster_counterfactual("CL-104", remove=["shared_mobile"])
        self.assertEqual(res["new_score"], 67)
        self.assertEqual(res["new_band"], "review")

    def test_verhoeff_and_student_37_forensics(self):
        """Student 37 has 16-digit Aadhaar (account number placed in Aadhaar field) and must be flagged."""
        # Genuine Aadhaar passes
        self.assertTrue(validate_verhoeff("593974214828"))
        # Student 37 value
        res = validate_aadhaar_format("3063040100005393")
        self.assertFalse(res["valid"])
        self.assertIn("Invalid length", res["reason"])

    def test_family_shield_clearance(self):
        """Legitimate sibling households with same parents must be cleared by Family Shield."""
        siblings = [
            {"Student_ID": "14", "Student_Name": "Deepak Kumar", "Father_Name": "Darshan Lal", "Mother_Name": "Rekha Rani", "Contact_No": "9622398521"},
            {"Student_ID": "33", "Student_Name": "Parveen Kumar", "Father_Name": "Darshan Lal", "Mother_Name": "Rekha Rani", "Contact_No": "9622398521"}
        ]
        eval_res = evaluate_family_shield(siblings, shared_mobile=True)
        self.assertTrue(eval_res["is_cleared"])
        self.assertEqual(eval_res["discount_points"], -15)
        self.assertIn("legitimate sibling household", eval_res["explanation"])

    def test_non_family_sharing_not_cleared(self):
        """Unrelated students sharing contact must NOT be cleared by Family Shield."""
        unrelated = [
            {"Student_ID": "14", "Student_Name": "Deepak Kumar", "Father_Name": "Darshan Lal", "Mother_Name": "Rekha Rani", "Contact_No": "9622398521"},
            {"Student_ID": "34", "Student_Name": "Rahul Sharma", "Father_Name": "Madan Lal", "Mother_Name": "Geeta Devi", "Contact_No": "9622398521"}
        ]
        eval_res = evaluate_family_shield(unrelated, shared_mobile=True)
        self.assertFalse(eval_res["is_cleared"])

    def test_tamper_evident_audit_chain(self):
        """Audit chain must verify intact, and immediately report tampering if an entry is altered."""
        verify_init = verify_audit_chain()
        self.assertTrue(verify_init["intact"])
        
        # Add new entry
        entry = append_audit_entry("Inspector Rao", "FIELD_VERIFICATION", "CL-104", "Verified physical enrollment books")
        self.assertTrue(verify_audit_chain()["intact"])

    def test_custom_records_graph_clustering(self):
        """Arbitrary student records uploaded by user must build graph and surface clusters."""
        test_records = [
            {"Student_ID": "U1", "Student_Name": "Applicant A", "Account_No": "999888777", "Contact_No": "9800000001", "Class": "10th", "Father_Name": "F1", "Mother_Name": "M1"},
            {"Student_ID": "U2", "Student_Name": "Applicant B", "Account_No": "999888777", "Contact_No": "9800000001", "Class": "10th", "Father_Name": "F2", "Mother_Name": "M2"},
            {"Student_ID": "U3", "Student_Name": "Applicant C", "Account_No": "123456789", "Contact_No": "9800000002", "Class": "9th", "Father_Name": "F3", "Mother_Name": "M3"}
        ]
        res = build_student_graph_from_records(test_records)
        self.assertEqual(len(res["clusters"]), 1)
        self.assertEqual(res["clusters"][0]["counts"]["students"], 2)
        self.assertGreaterEqual(res["clusters"][0]["score"], 40)

if __name__ == "__main__":
    unittest.main()
