# Mock PO risk analysis data generator and FastAPI endpoint
from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter()

# Mock data for demonstration
PRODUCTS = ['A', 'B', 'C']
SOURCES = ['DC1', 'DC2', 'DC3']
DESTS = ['WH1', 'WH2', 'WH3']
RISK_TYPES = [
    'Not In Full',
    'Late Delivery',
    'Truck Detention',
    'No Actionable Risk'
]
ACTIONS = {
    'Not In Full': [
        'Transfer stock from nearest DC',
        'No action possible'
    ],
    'Late Delivery': [
        'Ask driver to expedite',
        'Reschedule delivery slot'
    ],
    'Truck Detention': [
        'Reschedule delivery slot',
        'Alert warehouse for dock availability'
    ],
    'No Actionable Risk': ['No action needed']
}


def generate_mock_po_risk(n=20):
    data = []
    today = datetime.now().date()
    for i in range(n):
        po_id = f'PO{1000+i}'
        product = random.choice(PRODUCTS)
        source = random.choice(SOURCES)
        dest = random.choice(DESTS)
        req_qty = random.choice([3000, 5000, 13000, 15000])
        avail_qty = random.choice([3000, 5000, 13000, 15000])
        ship_date = today
        transit_hours = random.choice([12, 24, 35, 48])
        eta = ship_date + timedelta(hours=transit_hours//24)
        req_date = ship_date + timedelta(days=1)
        # Risk logic
        if avail_qty < req_qty:
            risk_type = 'Not In Full'
            risk_reason = f'Not enough stock at {source}'
            action = ACTIONS[risk_type][0] if avail_qty > 0 else ACTIONS[risk_type][1]
            severity = 'High'
        elif transit_hours > 24:
            risk_type = 'Late Delivery'
            risk_reason = f'Transit time ({transit_hours}h) exceeds required delivery date'
            action = ACTIONS[risk_type][0]
            severity = 'Medium'
        elif random.random() < 0.2:
            risk_type = 'Truck Detention'
            risk_reason = 'Gate-in after dock closing time'
            action = ACTIONS[risk_type][0]
            severity = 'Medium'
        else:
            risk_type = 'No Actionable Risk'
            risk_reason = 'No significant risk detected'
            action = ACTIONS[risk_type][0]
            severity = 'Low'
        data.append({
            'po_id': po_id,
            'product': product,
            'source': source,
            'dest': dest,
            'req_qty': req_qty,
            'avail_qty': avail_qty,
            'ship_date': str(ship_date),
            'eta': str(eta),
            'req_date': str(req_date),
            'risk_type': risk_type,
            'risk_reason': risk_reason,
            'action': action,
            'severity': severity
        })
    return data


@router.get('/api/po-risk-analysis')
def po_risk_analysis():
    """Return mock PO risk analysis data"""
    return generate_mock_po_risk(30)
